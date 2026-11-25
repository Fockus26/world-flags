# kit-deploy · Dockerfile de World Flags (D243). Parte de la plantilla de kit-deploy, que es
# para Next.js; esta es la de Astro con `@astrojs/node` en modo standalone. La construye
# .github/workflows/deploy-vps.yml con
#   docker build --build-arg GIT_SHA=<commit> -t ghcr.io/<owner>/<repo>:<commit> .
# Contrato de kit-deploy: escucha en :3000, corre como uid 1001, `/api/health` responde 200.

ARG BUN_VERSION=1.4.4
ARG NODE_VERSION=22-alpine

# ── dependencias ─────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Solo las de producción, para el runtime: el servidor de Astro importa sus dependencias
# de node_modules (no las empaqueta).
FROM oven/bun:${BUN_VERSION} AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ── build ────────────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
ARG GIT_SHA
ENV ASTRO_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ -z "$GIT_SHA" ]; then echo "GIT_SHA build arg is required" >&2; exit 1; fi
# Las variables públicas del entorno (deploy-vps.yml › Build variables) llegan montadas en
# .env.production.local, en ninguna capa. kit-deploy solo manda `NEXT_PUBLIC_*`: Astro solo
# inyecta `PUBLIC_*`, así que aquí se copian con ese nombre. Sin el archivo (build a mano)
# se construye sin ellas. BUILD_ENV_HASH hace que valores nuevos no reutilicen la caché.
ARG BUILD_ENV_HASH
RUN --mount=type=secret,id=build_env,target=/app/.env.production.local,required=false \
    if [ -f .env.production.local ]; then set -a; . ./.env.production.local; set +a; fi; \
    export PUBLIC_VAPID_PUBLIC_KEY="${PUBLIC_VAPID_PUBLIC_KEY:-${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-}}"; \
    bun run build
RUN if [ ! -f dist/server/entry.mjs ]; then \
      echo "no dist/server/entry.mjs: astro.config debe usar @astrojs/node (standalone)" >&2; exit 1; \
    fi

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS run
WORKDIR /app
ARG GIT_SHA
# kit-agent pasa NODE_OPTIONS según el límite de memoria; este valor cabe en 512 MB para
# un `docker run` a mano.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=384 \
    GIT_SHA=${GIT_SHA}
# uid/gid 1001 = el `--user=1001:1001` de kit-agent. Los archivos son de root (solo lectura
# para el proceso).
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app -H -D app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER 1001:1001
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
