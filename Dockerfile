FROM node:20-alpine AS backend-builder

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app/ats-backend

COPY ats-backend/package*.json ./
RUN npm ci

COPY ats-backend/tsconfig.json ./
COPY ats-backend/prisma ./prisma
COPY ats-backend/src ./src
COPY ats-backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS frontend-builder

WORKDIR /app/ats-frontend

COPY ats-frontend/package*.json ./
RUN npm ci

COPY ats-frontend/index.html ./
COPY ats-frontend/vite.config.js ./
COPY ats-frontend/tailwind.config.cjs ./
COPY ats-frontend/postcss.config.cjs ./
COPY ats-frontend/public ./public
COPY ats-frontend/src ./src

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV NODE_ENV=production \
    PORT=3000 \
    BASE_URL=https://openrouter.ai/api/v1 \
    ANALYSIS_MODEL=openrouter/free \
    CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
    DATABASE_URL=file:./data/dev.db \
    DATABASE_PROVIDER=sqlite \
    QUEUE_PROVIDER=memory \
    PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app/ats-backend

COPY --from=backend-builder /app/ats-backend/package*.json ./
COPY --from=backend-builder /app/ats-backend/node_modules ./node_modules
COPY --from=backend-builder /app/ats-backend/prisma ./prisma
COPY --from=backend-builder /app/ats-backend/dist ./dist
COPY --from=backend-builder /app/ats-backend/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=frontend-builder /app/ats-frontend/build ./build

RUN chmod +x ./docker-entrypoint.sh \
    && mkdir -p ./data ./uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
