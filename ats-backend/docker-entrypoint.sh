#!/bin/sh
set -eu

cd /app/ats-backend

mkdir -p ./data ./uploads

if [ "${RESET_DATABASE_ON_START:-0}" = "1" ]; then
    echo "Resetting SQLite database before startup..."
    rm -f ./data/dev.db
fi

if [ -z "${PUPPETEER_EXECUTABLE_PATH:-}" ]; then
    if command -v chromium-browser >/dev/null 2>&1; then
        export PUPPETEER_EXECUTABLE_PATH="$(command -v chromium-browser)"
    elif command -v chromium >/dev/null 2>&1; then
        export PUPPETEER_EXECUTABLE_PATH="$(command -v chromium)"
    fi
fi

echo "Applying Prisma schema..."
npx prisma db push --skip-generate

echo "Starting ATS Resume Analyzer on port ${PORT:-3000}..."
exec node dist/index.js
