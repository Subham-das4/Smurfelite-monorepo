import { Router, Request, Response } from "express";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

/** Placeholder — full API in Phase 5 */
router.get("/", (_req: Request, res: Response) => {
  res.status(501).json({
    message: "Disputes API not implemented yet.",
    phase: 5,
  });
});

export default router;
