import express from "express";
import type { Request, Response } from "express";
import cors from "cors"; // Necessary for connecting Next.js (port 3000) to Express (port 8080)
import prisma from "./lib/prisma.ts"; // Our single, shared Prisma Client instance

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

// ----------------------------------------
// Basic Routes
// ----------------------------------------

// 1. Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("SmurfElite API is running.");
});

// 2. Database Connectivity Test Route
app.get("/api/health/db", async (req: Request, res: Response) => {
  try {
    // Simple query to test the connection (Prisma's internal logic handles this)
    await prisma.$queryRaw`SELECT 1`;
    res
      .status(200)
      .json({ status: "OK", message: "Database connection successful." });
  } catch (error) {
    console.error("Database check failed:", error);
    res
      .status(503)
      .json({ status: "Error", message: "Database connection failed.", error });
  }
});

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
