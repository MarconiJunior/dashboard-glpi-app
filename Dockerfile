# ============================================================
# Stage 1 — deps: instala dependências de produção + dev
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instala pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2 — builder: compila o Next.js
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build necessárias (sem segredos em runtime)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN pnpm build

# ============================================================
# Stage 3 — runner: imagem final mínima
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Desativa telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Arquivos estáticos e standalone output
COPY --from=builder /app/public            ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usa o server standalone gerado pelo Next.js
CMD ["node", "server.js"]
