import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import prisma, { ensureAdminUser, ensureBuyerUser } from "./lib/prisma.js";
import apiRouter from "./lib/route.js";
import { globalErrorHandler } from "./utils/errors.js";
import logger from "./utils/logger.js";

const app = express();
const PORT = process.env.PORT || 8080;

// ----------------------------------------
// Security Middleware
// ----------------------------------------
app.use(helmet());

// ----------------------------------------
// Core Middleware
// ----------------------------------------
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ----------------------------------------
// HTTP Request Logger
// ----------------------------------------
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// ----------------------------------------
// API Routes
// ----------------------------------------
app.use("/api", apiRouter);

// ----------------------------------------
// Global Error Handler (must be last)
// ----------------------------------------
app.use(globalErrorHandler);

// ----------------------------------------
// Server Start
// ----------------------------------------
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  prisma
    .$connect()
    .then(() => {
      logger.info("Prisma Client successfully connected to PostgreSQL.");
      ensureAdminUser();
      ensureBuyerUser();
    })
    .catch((error) => {
      logger.error("Prisma connection failed on startup:", error);
    });
});
