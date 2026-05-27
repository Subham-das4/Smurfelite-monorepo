import { Router, Request, Response } from "express";

const router = Router();

/** Placeholder — full CRUD in Phase 5 */
router.get("/", (_req: Request, res: Response) => {
  res.status(501).json({
    message: "Game categories API not implemented yet.",
    phase: 5,
  });
});

export default router;
