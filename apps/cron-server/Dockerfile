# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/cron-server/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps/express-server/prisma ./apps/express-server/prisma
COPY apps/express-server/package.json ./apps/express-server/package.json
COPY apps/cron-server ./apps/cron-server

RUN pnpm install --frozen-lockfile
ENV DATABASE_URL="postgresql://smurfelite:build@localhost:5432/smurfelite"
RUN pnpm --filter @smurfelite/express-server prisma:generate
RUN pnpm --filter @smurfelite/cron-server build

FROM node:22-alpine AS run
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/express-server/prisma ./apps/express-server/prisma
COPY --from=build /app/apps/cron-server ./apps/cron-server

ENV NODE_ENV=production
WORKDIR /app/apps/cron-server
CMD ["node", "dist/index.js"]
