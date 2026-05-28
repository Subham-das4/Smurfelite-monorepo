# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/nextjs-app/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

ARG NEXT_PUBLIC_EXPRESS_SERVER_API
ARG NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID

ENV NEXT_PUBLIC_EXPRESS_SERVER_API=$NEXT_PUBLIC_EXPRESS_SERVER_API
ENV NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps/express-server/prisma ./apps/express-server/prisma
COPY apps/express-server/package.json ./apps/express-server/package.json
COPY apps/nextjs-app ./apps/nextjs-app

RUN pnpm install --frozen-lockfile
ENV DATABASE_URL="postgresql://smurfelite:build@localhost:5432/smurfelite"
RUN pnpm --filter @smurfelite/express-server prisma:generate
RUN pnpm --filter nextjs-app build

FROM node:22-alpine AS run
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build /app/apps/nextjs-app/public ./apps/nextjs-app/public
COPY --from=build --chown=nextjs:nodejs /app/apps/nextjs-app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/nextjs-app/.next/static ./apps/nextjs-app/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/nextjs-app/server.js"]
