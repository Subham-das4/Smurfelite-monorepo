import { Router } from "express";
import { Role } from "@smurfelite/types";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import {
  getErrorLogsController,
  getExceptionLogsController,
  getHttpLogsController,
} from "./logs.controller.js";

const router = Router();

router.use(authenticate, authorize([Role.ADMIN]));

// GET /api/logs/errors?n=50
router.get("/errors", getErrorLogsController);

// GET /api/logs/exceptions?n=20
router.get("/exceptions", getExceptionLogsController);

// GET /api/logs/http?n=100
router.get("/http", getHttpLogsController);

export default router;
