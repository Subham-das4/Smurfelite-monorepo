import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import prisma from "./lib/prisma.ts";
import apiRouter from "./lib/route.ts";

const app = express();
const PORT = process.env.PORT || 8080;

// ----------------------------------------
// Middleware Configuration
// ----------------------------------------
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow Next.js access
    credentials: true,
  })
);

app.use("/api", apiRouter);

// ----------------------------------------
// Server Start
// ----------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Check for a successful Prisma connection on startup
  prisma
    .$connect()
    .then(() => {
      console.log("Prisma Client successfully connected to PostgreSQL.");
    })
    .catch((error) => {
      console.error("Prisma connection failed on startup:", error);
      // You might want to exit the process if the database is critical
      // process.exit(1);
    });
});
