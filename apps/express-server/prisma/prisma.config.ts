// apps/express-server/prisma/prisma.config.ts
import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "./schema.prisma",

  // In Prisma v7 the connection URL must live in prisma.config.ts
  datasource: {
    url: env("DATABASE_URL"),
    // (optional) shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },

  // migrations and other config can live here too
  migrations: {
    path: "./migrations",
  },
});
