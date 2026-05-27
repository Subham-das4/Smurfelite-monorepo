import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma, {
  ensureAdminUser,
  ensureBuyerUser,
  ensureSellerUser,
} from "./lib/prisma.js";
import apiRouter from "./lib/route.js";
import { globalErrorHandler } from "./utils/errors.js";
import logger from "./utils/logger.js";

// Ensure logs/ directory exists before opening streams
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(__dirname, "../logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const httpLogStream = fs.createWriteStream(path.join(logsDir, "http.log"), {
  flags: "a",
});

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
const corsOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:3000,http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// ----------------------------------------
// HTTP Request Logger
// ----------------------------------------
app.use(
  morgan("combined", {
    stream: {
      write: (message) => {
        logger.http(message.trim());   // console via Winston
        httpLogStream.write(message);  // logs/http.log file
      },
    },
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
      ensureSellerUser();
    })
    .catch((error) => {
      logger.error("Prisma connection failed on startup:", error);
    });
});
