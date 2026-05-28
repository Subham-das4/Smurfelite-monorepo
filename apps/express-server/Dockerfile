# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/express-server/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps/express-server ./apps/express-server

RUN pnpm install --frozen-lockfile
# Placeholder for Prisma 7 config at build time (generate does not connect to DB)
ENV DATABASE_URL="postgresql://smurfelite:build@localhost:5432/smurfelite"
RUN pnpm --filter @smurfelite/express-server prisma:generate
RUN pnpm --filter @smurfelite/express-server build

FROM node:22-alpine AS run
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate \
  && apk add --no-cache openssl

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/express-server ./apps/express-server
COPY docker/scripts/express-entrypoint.sh /usr/local/bin/express-entrypoint.sh

RUN chmod +x /usr/local/bin/express-entrypoint.sh

ENV NODE_ENV=production
WORKDIR /app/apps/express-server
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/express-entrypoint.sh"]
