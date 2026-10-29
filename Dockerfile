# Build-only stage; the runtime image below is nginx, so Node/npm do not ship.
FROM node:24.22.1-alpine3.24 AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build stamps a placeholder origin into the asset URLs; the startup script
# rewrites it to the runtime VITE_BASE_URL (see docker-entrypoint.d below). One
# image serves any environment, with the origin chosen at run time.
ENV VITE_BASE_URL=https://VITE_BASE_URL_PLACEHOLDER
ENV VITE_SOURCEMAP=false

RUN npm run build

# nginx-unprivileged runs as a non-root user, listens on a non-privileged port,
# and writes its pid + temp dirs under /tmp — so the image runs under a hardened
# securityContext (readOnlyRootFilesystem, non-root) with only /tmp writable.
# Pinned tag (stable = 1.30.x) so rebuilds pick the same patched Alpine 3.24 base.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine3.24 AS runner

# zlib (CVE-2026-85091) is preinstalled in the base image, so `apk add` would not
# update it. The base image runs as UID 101, so switch to root for this layer only.
USER root
RUN apk upgrade --no-cache zlib brotli-libs curl libcurl libexpat libx11 libxpm
USER 101

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runs (via the stock nginx entrypoint) before nginx starts: copies the built
# assets into the writable /tmp/html and rewrites the placeholder origin there to
# the VITE_BASE_URL passed at runtime. The script is tracked executable (100755),
# so COPY preserves the bit — no chmod needed (a RUN chmod would fail as the
# non-root build user in this base image).
COPY docker-entrypoint.d/40-replace-base-url.sh /docker-entrypoint.d/40-replace-base-url.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
