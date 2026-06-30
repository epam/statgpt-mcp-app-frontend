FROM node:24-alpine AS base

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

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runs (via the stock nginx entrypoint) before nginx starts: rewrites the
# placeholder origin in the built assets to the VITE_BASE_URL passed at runtime.
COPY docker-entrypoint.d/40-replace-base-url.sh /docker-entrypoint.d/40-replace-base-url.sh
RUN chmod +x /docker-entrypoint.d/40-replace-base-url.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
