#!/bin/sh
set -e
cd /app/apps/express-server

echo "Running Prisma migrations..."
npx prisma migrate deploy

# Fail fast with a visible message (import-time throws are easy to miss in logs)
missing=""
[ -z "$ENCRYPTION_KEY" ] && missing="${missing} ENCRYPTION_KEY"
[ -n "$ENCRYPTION_KEY" ] && [ "${#ENCRYPTION_KEY}" -ne 32 ] && \
  echo "FATAL: ENCRYPTION_KEY must be exactly 32 characters (got ${#ENCRYPTION_KEY})." >&2 && exit 1
[ -z "$JWT_SECRET" ] && missing="${missing} JWT_SECRET"
[ -z "$SALT_ROUNDS" ] && missing="${missing} SALT_ROUNDS"
[ -z "$TOKEN_EXPIRATION" ] && missing="${missing} TOKEN_EXPIRATION"
if [ -n "$missing" ]; then
  echo "FATAL: Missing required env in docker/.env:$missing" >&2
  echo "See docker/.env.example (ENCRYPTION_KEY = 32 chars, JWT_SECRET, SALT_ROUNDS, TOKEN_EXPIRATION)." >&2
  exit 1
fi

echo "Starting API server..."
exec node dist/index.js 2>&1
