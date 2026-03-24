# Docker Guide

This project ships as a single container: the backend serves the built frontend and the API from the same process.

## Prerequisites

- Docker Desktop or a running Docker daemon
- An OpenRouter API key

## 1. Create the Docker env file

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` and set at least:

- `OPENROUTER_API_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_HOST_PORT` if `3000` is already taken on your machine

The default SQLite path already points to the mounted Docker volume:

```env
DATABASE_URL=file:./data/dev.db
DATABASE_PROVIDER=sqlite
QUEUE_PROVIDER=memory
RESET_DATABASE_ON_START=0
```

## 2. Run with Docker Compose

```bash
docker compose --env-file .env.docker up --build -d
```

Check status:

```bash
docker compose --env-file .env.docker ps
curl http://localhost:${APP_HOST_PORT:-3000}/api/health
```

Useful commands:

```bash
docker compose --env-file .env.docker logs -f
docker compose --env-file .env.docker down
docker compose --env-file .env.docker down -v
```

Use `docker compose down -v` only when you want to remove the persisted SQLite database and uploads volumes.

## 3. Run with plain Docker

Build:

```bash
docker build -t ats-resume-analyzer:latest .
```

Run:

```bash
docker run --rm -d \
  --name ats-resume-analyzer \
  --env-file .env.docker \
  -p 3000:3000 \
  -v ats-data:/app/ats-backend/data \
  -v ats-uploads:/app/ats-backend/uploads \
  ats-resume-analyzer:latest
```

Stop:

```bash
docker stop ats-resume-analyzer
```

## 4. Endpoints

- App: `http://localhost:${APP_HOST_PORT:-3000}`
- Health: `http://localhost:${APP_HOST_PORT:-3000}/api/health`
- Auth register: `POST http://localhost:3000/api/auth/register`
- Auth login: `POST http://localhost:3000/api/auth/login`

## Notes

- The container initializes Prisma on startup with `prisma db push --skip-generate`.
- SQLite data persists in the mounted `ats-data` volume.
- The container auto-detects the system Chromium path for Puppeteer PDF export.
