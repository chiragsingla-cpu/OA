# dev: Vite dev server (used by docker-compose.yml)
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# build: static production bundle. The API URL is baked in at build time; the default "/api"
# works when nginx below serves the app and the API on the same domain.
FROM dev AS build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# prod: nginx serves the app and forwards /api to the API container (see nginx.conf.template)
FROM nginx:1.27-alpine AS prod
ENV API_UPSTREAM=api:9000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1/up >/dev/null || exit 1
