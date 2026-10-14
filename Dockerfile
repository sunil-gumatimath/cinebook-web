# ---------- build stage ----------
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies from the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_BASE_URL is baked in at build time by Vite. It defaults to /api,
# which the nginx layer below proxies to the Spring Boot backend, so the
# browser always talks to a single origin and CORS never comes into play.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------- runtime stage ----------
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html

# The nginx entrypoint renders /etc/nginx/templates/*.template into
# /etc/nginx/conf.d/, substituting only the variables named in the filter.
# Restricting the filter keeps nginx's own $host / $uri / $request_uri
# variables from being replaced.
ENV API_HOST=backend \
    API_PORT=8080 \
    NGINX_ENVSUBST_FILTER="API_HOST|API_PORT"

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
