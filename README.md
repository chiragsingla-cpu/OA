# AI Employee Support & Onboarding Assistant (POC)

Employees ask questions about company documents (HR policies, handbook, onboarding checklists, BRDs) and get answers grounded in those documents. Each user only sees documents for their role. Admins manage the documents.

```
React (frontend/)  →  Laravel API (backend/api)  →  AI service: FastAPI + LangGraph (backend/ai-service)
                              ↘                        ↙
                                MongoDB (app data + vector search)
```

| Folder | What it is | Deploy as |
|---|---|---|
| `frontend/` | React + Vite + Tailwind | Static files (`npm run build` → `dist/`), or `docker build --target prod` for nginx |
| `backend/api/` | Laravel 13: auth (Sanctum), roles, documents, chat gateway | PHP app/container |
| `backend/ai-service/` | FastAPI + LangGraph + Claude Haiku 4.5 + local embeddings | Python container, internal network only |
| `backend/sample-docs/` | Demo documents loaded by `php artisan app:seed-docs` | — |

## How a question is answered
1. React sends the question to Laravel (`POST /api/chat`) with the user's token.
2. Laravel adds the **user's role from the database** and the last 6 messages, then calls the AI service.
3. LangGraph runs `classify` → (`retrieve` → `generate`) or `decline`:
   - **classify**: one Claude call returns the category (docs / onboarding / personal account / out of scope) and a standalone version of follow-up questions.
   - **retrieve**: MongoDB `$vectorSearch` with the filter `allowed_roles ∈ role`. This is where access control is enforced, so employees can never retrieve admin-only chunks.
   - **generate**: Claude answers only from the retrieved excerpts and cites the document titles.
4. Laravel stores the question and answer (conversation history + analytics) and returns the answer to React.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2 backend on Windows)
- An Anthropic API key from https://console.anthropic.com

## Run it
```powershell
copy .env.example .env        # then set ANTHROPIC_API_KEY and AI_INTERNAL_KEY
docker compose up --build -d  # first start downloads images + dependencies (several minutes)
docker compose ps             # all 4 services should be "Up"
```
`up` keeps running because it's a server. It never "finishes". With `-d` it runs in the background. Use `docker compose logs -f` to watch the logs and `docker compose down` to stop.
In a second terminal, once the containers are up:
```powershell
docker compose exec backend php artisan migrate --seed     # collections, indexes, demo users
docker compose exec backend php artisan app:seed-docs      # load + index sample documents
```
Open http://localhost:5173.

| Demo account | Password | Sees |
|---|---|---|
| admin@example.com | password | Admin dashboard, all documents (including "HR Internal: Salary Bands") |
| employee@example.com | password | Onboarding view + assistant, employee documents only |

> The first document indexing downloads the embedding model (~130 MB) into a Docker volume, so it takes longer.
> Don't run `migrate:fresh`: it drops every collection, including the AI service's vector chunks. If you do, run `app:seed-docs` again.

## Try it
1. Log in as **employee** → the Onboarding tab shows the checklist (progress saved in the browser), handbook, policies and BRD.
2. Assistant: *"How many days of annual leave do I get?"* → answer cites the Leave Policy.
3. Follow-up: *"and can I carry them over?"* → understood from context.
4. *"What are the salary bands for senior engineers?"* → not found (that document is admin-only).
5. *"What's the weather today?"* → polite out-of-scope reply.
6. Log in as **admin** → upload a document → status becomes `indexed` → the employee can ask about it. Analytics shows the questions.

## Tests
```powershell
docker compose exec ai-service pytest                # graph routing, chunking, history handling (Claude mocked)
docker compose exec backend vendor/bin/phpunit       # auth, role guard, document visibility, chat gateway (AI faked)
```
Laravel tests use a separate `onboarding_assistant_test` database, which is wiped before each test.

## Configuration (`.env`)
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (used only by the AI service) |
| `ANTHROPIC_MODEL` | Default `claude-haiku-4-5` ($1 / $5 per 1M input/output tokens). Change without code edits |
| `AI_INTERNAL_KEY` | Shared secret: Laravel → AI service (`X-Internal-Key` header) |
| `MONGODB_DB` | Database name |

Cost controls: top-4 chunks per question, 6-message history, `max_tokens` 1024 for answers, and no LLM call for out-of-scope or personal questions. Embeddings run locally, so they are free.

## API overview (Laravel, prefix `/api`)
| Method & path | Who |
|---|---|
| `POST auth/register`, `POST auth/login` | public (register always creates an `employee`) |
| `POST auth/logout`, `GET auth/me` | signed in |
| `GET documents`, `GET documents/{id}` | signed in (filtered by role) |
| `POST chat`, `GET conversations`, `GET conversations/{id}/messages` | signed in (own conversations only) |
| `GET checklists/{id}/progress`, `PUT checklists/{id}/progress` | signed in (own checklist progress) |
| `POST documents`, `PUT documents/{id}`, `DELETE documents/{id}`, `POST documents/{id}/reindex` | admin |
| `GET/POST admin/users`, `PUT/DELETE admin/users/{id}` | admin (cannot delete or demote themselves) |
| `GET admin/onboarding-progress`, `GET admin/analytics` | admin |

## Deploying later
- **Frontend**: `docker build --target prod --build-arg VITE_API_URL=https://api.yourco.com/api ./frontend`, or upload `dist/` to any static host.
- **API**: swap `php artisan serve` for nginx + php-fpm, and set `FRONTEND_URL` (CORS), `MONGODB_URI` and `AI_SERVICE_URL`.
- **AI service**: keep it on a private network. Only the API should reach it.
- **MongoDB**: MongoDB Atlas (vector search built in) works with the same code. Just change `MONGODB_URI`.

## Next steps (phase 4)
Streaming answers, more roles (`hr`, `new_joiner`), answer feedback (👍/👎), prompt caching once prompts pass 4096 tokens (Haiku's minimum), and a production web server.
