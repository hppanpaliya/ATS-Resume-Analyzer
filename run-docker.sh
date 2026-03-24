#!/bin/bash
set -euo pipefail

echo "ATS Resume Analyzer - Docker Deployment"
echo "======================================="

if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop or your Docker daemon first."
    exit 1
fi

if [ ! -f .env.docker ]; then
    echo "Missing .env.docker."
    echo "Create it first with:"
    echo "  cp .env.docker.example .env.docker"
    echo "Then edit .env.docker and add your OpenRouter key and JWT secrets."
    exit 1
fi

HOST_PORT="$(sed -n 's/^APP_HOST_PORT=//p' .env.docker | head -n 1)"
HOST_PORT="${HOST_PORT:-3000}"

echo
echo "Building and starting the stack..."
docker compose --env-file .env.docker up --build -d

echo
echo "Container status:"
docker compose ps

echo
echo "Endpoints:"
echo "  App:    http://localhost:${HOST_PORT}"
echo "  Health: http://localhost:${HOST_PORT}/api/health"
echo
echo "Logs:"
echo "  docker compose logs -f"
echo
echo "Stop:"
echo "  docker compose down"
