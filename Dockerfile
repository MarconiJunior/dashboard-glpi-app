# ============================================================
# Stage 1 — deps: instala dependências
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Rede corporativa com inspeção SSL: desabilita verificação para npm e pnpm
RUN npm config set strict-ssl false

RUN npm install -g pnpm@10.29.3 --no-fund --no-audit

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================================
# Stage 2 — builder: compila o Next.js
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm config set strict-ssl false \
 && npm install -g pnpm@10.29.3 --no-fund --no-audit 

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ============================================================
# Stage 3 — runner: imagem final mínima
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public                                  ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone  ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static      ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
