#!/bin/sh
set -e
cd /app/apps/express-server
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Starting API server..."
exec node dist/index.js
