# Dockerfile multi-stage pour Fly.io / Render / Railway / Koyeb
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install --include=dev

COPY . .
RUN npm run build

# ────────── Production stage ──────────
FROM node:20-alpine
WORKDIR /app

# Copie des artefacts buildés et des dépendances de production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/uploads ./server/uploads
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/client/package*.json ./client/

# Volume persistant /data pour SQLite (mounté par fly.toml)
RUN mkdir -p /data && chown -R node:node /data

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/checkbtp.db
ENV UPLOADS_PATH=/data/uploads

EXPOSE 3001
USER node

CMD ["node", "server/dist/index.js"]
