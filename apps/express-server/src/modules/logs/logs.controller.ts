import { Request, Response, NextFunction } from "express";
import { readErrorLogs, readExceptionLogs, readHttpLogs } from "./logs.service.js";

/**
 * GET /api/logs/errors?n=50
 * Returns the last n entries from logs/error.log.
 */
export const getErrorLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const n = parseInt(req.query.n as string);
    const entries = await readErrorLogs(n);
    res.status(200).json({ count: entries.length, entries });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/logs/exceptions?n=20
 * Returns the last n exception entries from logs/exceptions.log (parsed JSON).
 */
export const getExceptionLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const n = parseInt(req.query.n as string);
    const entries = await readExceptionLogs(n);
    res.status(200).json({ count: entries.length, entries });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/logs/http?n=100
 * Returns the last n HTTP access log lines from logs/http.log.
 */
export const getHttpLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const n = parseInt(req.query.n as string);
    const entries = await readHttpLogs(n);
    res.status(200).json({ count: entries.length, entries });
  } catch (error) {
    next(error);
  }
};
