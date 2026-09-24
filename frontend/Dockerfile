# dev: Vite dev server (used by docker-compose)
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# build: static production bundle. Pass the public API URL at build time:
#   docker build --target prod --build-arg VITE_API_URL=https://api.example.com/api .
FROM dev AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# prod: serve the static files with nginx (or upload dist/ to any static host)
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
