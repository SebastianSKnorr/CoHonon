# ── deps ──────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

# ── builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npm run build

# ── runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 8080
CMD ["node", "dist/index.js"]
