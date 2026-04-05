import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(__dirname, "../../..", "logs");

const MAX_N = 500;
const DEFAULT_N = 50;

function clamp(n: number): number {
  if (!n || isNaN(n) || n < 1) return DEFAULT_N;
  return Math.min(n, MAX_N);
}

async function safeReadFile(filePath: string): Promise<string> {
  if (!existsSync(filePath)) return "";
  return readFile(filePath, "utf-8");
}

/**
 * Reads logs/error.log and returns the last n entries.
 * Each entry starts with an ISO timestamp (e.g. 2026-04-05T10:55:18.941Z).
 */
export async function readErrorLogs(rawN: number): Promise<string[]> {
  const n = clamp(rawN);
  const content = await safeReadFile(path.join(logsDir, "error.log"));
  if (!content.trim()) return [];

  // Split on lines that begin with an ISO 8601 timestamp
  const entries = content
    .split(/(?=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/m)
    .map((e) => e.trim())
    .filter(Boolean);

  return entries.slice(-n);
}

/**
 * Reads logs/exceptions.log (NDJSON — one JSON object per line) and returns
 * the last n parsed entries. Each entry has at minimum: date, message, level, stack.
 */
export async function readExceptionLogs(rawN: number): Promise<Record<string, unknown>[]> {
  const n = clamp(rawN);
  const content = await safeReadFile(path.join(logsDir, "exceptions.log"));
  if (!content.trim()) return [];

  const entries = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);

  return entries.slice(-n).map(({ date, level, message, stack, trace }) => ({
    date,
    level,
    message,
    stack,
    trace,
  }));
}

/**
 * Reads logs/http.log (Morgan combined format — one request per line) and
 * returns the last n lines.
 */
export async function readHttpLogs(rawN: number): Promise<string[]> {
  const n = clamp(rawN);
  const content = await safeReadFile(path.join(logsDir, "http.log"));
  if (!content.trim()) return [];

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.slice(-n);
}
