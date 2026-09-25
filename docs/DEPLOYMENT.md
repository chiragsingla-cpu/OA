# Deployment guide

For whoever runs the server. It covers how the app is packaged, what AWS resources it needs, the first deploy, and routine updates.

## What runs

```
Internet ──HTTPS──> load balancer / Caddy / host nginx ──HTTP──> web :80   (only published port)
                                                                   │  /        React app (static files)
                                                                   │  /api/*   FastCGI → api :9000 (Laravel php-fpm)
                                                                   │  /up      health check
                                                     api ──HTTP──> ai :8001  (FastAPI + LangGraph, Claude)
                                                     api, ai ────> MongoDB (Atlas, or Atlas Local container)
                                                     api ────────> S3 bucket (original document files, private)
                                                     ai ─────────> api.anthropic.com
```

| Image tag (in `dhi_tech_forum`) | Contents | Needs |
|---|---|---|
| `web-<tag>` | nginx 1.27 + built React app | reaches `api:9000` |
| `api-<tag>` | PHP 8.3 php-fpm, Laravel, dependencies baked in | MongoDB, S3, `ai:8001` |
| `ai-<tag>` | Python 3.12, FastAPI, embedding model baked in (no Hugging Face access needed) | MongoDB, Anthropic API |

`<tag>` is the git commit the images were built from. Always deploy an exact tag, never "latest", so you can roll back.

## 1. Build and push the images (developer)

Needs Docker and ECR push access: the AWS CLI configured (`aws configure`), or, without the CLI, `-AwsEnvFile <file>` pointing at a file (outside the repo) with `AWS_ACCESS_KEY_ID=` and `AWS_SECRET_ACCESS_KEY=` lines.

```powershell
./deploy/build-and-push.ps1 -Push                        # amd64 server
./deploy/build-and-push.ps1 -Push -Platform linux/arm64  # ARM / Graviton server
```

The script refuses to push uncommitted code and prints the three `*_IMAGE=` lines for the server's `.env`. Without `-Push` it only builds, for local testing. If ECR uses one repository per image, pass `-Repository` and adjust the image lines accordingly.

## 2. AWS resources (one time)

**Server:** Linux with Docker Engine and the Compose plugin (v2.20+). 2 vCPU / 4 GB RAM is enough; add ~2 GB if you run MongoDB on the same host. Firewall: allow 22, 80 and 443 only. Put the server in `ap-south-1`, the same region as ECR and S3.

**S3 bucket** for uploaded files: private ("Block all public access" on), default encryption SSE-S3. Versioning is optional. Grant the server (preferably an EC2 instance role, otherwise an IAM user's keys in `.env`):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::YOUR-BUCKET/documents/*"
  }]
}
```

The server also needs ECR pull access (`AmazonEC2ContainerRegistryReadOnly`, or equivalent).

**MongoDB:** it must support `$vectorSearch`. Use either:
- **MongoDB Atlas** (recommended; backups managed): create a cluster and a database user, and allow the server's IP. Put the `mongodb+srv://` string in `MONGODB_URI`.
- **Atlas Local container** on the server: start compose with `--profile local-mongo` and set `MONGO_ROOT_PASSWORD`. Back up the `mongo_data` volume yourself.

## 3. First deploy

Copy `docker-compose.prod.yml` and `.env.production.example` to the server (for example `/opt/onboarding`), then:

```bash
cp .env.production.example .env && chmod 600 .env   # fill in every value (comments explain each one)
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 464092293482.dkr.ecr.ap-south-1.amazonaws.com

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d          # add --profile local-mongo for self-hosted MongoDB

# One time: database collections and indexes, the first admin, sample documents
docker compose -f docker-compose.prod.yml exec api php artisan migrate --force
docker compose -f docker-compose.prod.yml exec api php artisan app:create-admin you@company.com --name="Your Name"
docker compose -f docker-compose.prod.yml exec api php artisan app:seed-docs      # optional demo content
```

`app:create-admin` prints a random password once. The sample documents include an admin-only "Salary Bands" example; delete it in the admin UI if you don't want it.

**HTTPS:** terminate TLS in front of `WEB_PORT`, for example with an AWS load balancer and ACM certificate, or Caddy on the host (set `WEB_PORT=8080`, then Caddyfile: `onboarding.example.com { reverse_proxy localhost:8080 }`). Allow request bodies of at least 12 MB and a read timeout of at least 120 s, because chat answers can take over a minute. `APP_URL` must be the final https address.

**Check:** open `APP_URL`, sign in as the admin, upload a PDF (Documents tab) and wait for status `indexed`, then ask the assistant about it. `curl -I https://…/up` should return 200.

## 4. Updating and rolling back

Set the new tags in `.env` (`WEB_IMAGE`, `API_IMAGE`, `AI_IMAGE`), then run `pull` and `up -d` as above. New migrations, if any, run with `exec api php artisan migrate --force`. To roll back, put the previous tags back and run `up -d` again.

## Rules that prevent data loss or leaks

- **Never run `migrate:fresh` or `db:seed`/`--seed` in production.** `migrate:fresh` also deletes the AI search index. The seeder creates demo users whose password is `password`.
- Don't publish the `api`, `ai` or `mongo` ports. The AI service trusts the role that the API sends, so only the API may reach it.
- `AI_INTERNAL_KEY` must be at least 16 random characters. The AI service refuses to start otherwise.
- Keep `.env` out of git and backups that others can read. Rotate `ANTHROPIC_API_KEY` if it leaks, and set a monthly spend limit in the Anthropic console.
- Public sign-up is on by default. Set `REGISTRATION_ALLOWED_DOMAINS` to your company domain, or `REGISTRATION_ENABLED=false` so that only admins create accounts.

## Operations

- **Logs:** `docker compose -f docker-compose.prod.yml logs -f api ai web`. All services log to stdout/stderr.
- **Health:** `web` and `ai` have Docker health checks (`docker compose ps`). `GET /up` goes through nginx to Laravel.
- **Data to back up:** MongoDB (users, documents, chats, vector index) and the S3 bucket. The containers themselves are stateless.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `ai` keeps restarting, log says `AI_INTERNAL_KEY must be...` | key missing or shorter than 16 characters |
| `api` exits with `APP_KEY is not set` | fill `APP_KEY` (`echo "base64:$(openssl rand -base64 32)"`) |
| Chat says the assistant is unavailable | wrong or missing `ANTHROPIC_API_KEY`, or no outbound internet from the server |
| Upload fails with 413 | the proxy in front of `web` limits body size; raise it to 12 MB+ |
| Chat times out after 60 s at the proxy | raise the proxy/load balancer idle or read timeout to 120 s+ |
| Document status `failed` right after deploy | MongoDB unreachable, or the Atlas vector index is still building (wait 1–2 minutes, then Reindex) |
| Original file view returns 500 | S3 permissions, `AWS_BUCKET` or `AWS_DEFAULT_REGION` wrong (see `api` logs) |
