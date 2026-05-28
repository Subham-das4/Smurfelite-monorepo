# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/seller-app/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

ARG VITE_EXPRESS_SERVER_API=https://api.smurfelite.store/api
ARG VITE_APP_NAME=Seller Portal
ARG VITE_PERSIST_SECRET=change-me
ARG VITE_GOOGLE_CLIENT_ID=

ENV VITE_EXPRESS_SERVER_API=$VITE_EXPRESS_SERVER_API
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_PERSIST_SECRET=$VITE_PERSIST_SECRET
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps/express-server/prisma ./apps/express-server/prisma
COPY apps/express-server/package.json ./apps/express-server/package.json
COPY apps/seller-app ./apps/seller-app

RUN pnpm install --frozen-lockfile
ENV DATABASE_URL="postgresql://smurfelite:build@localhost:5432/smurfelite"
RUN pnpm --filter @smurfelite/express-server prisma:generate
RUN pnpm --filter seller-app build

FROM nginx:alpine AS run
COPY docker/nginx/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/seller-app/dist /usr/share/nginx/html
EXPOSE 80
