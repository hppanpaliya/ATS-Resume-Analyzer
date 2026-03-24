# Docker TL;DR

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` and set:

- `OPENROUTER_API_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_HOST_PORT` if `3000` is already busy

Run with Compose:

```bash
docker compose --env-file .env.docker up --build -d
curl http://localhost:3000/api/health
docker compose --env-file .env.docker logs -f
docker compose --env-file .env.docker down
```

Run with plain Docker:

```bash
docker build -t ats-resume-analyzer:latest .
docker run --rm -d --name ats-resume-analyzer --env-file .env.docker -p 3000:3000 ats-resume-analyzer:latest
curl http://localhost:3000/api/health
docker stop ats-resume-analyzer
```
