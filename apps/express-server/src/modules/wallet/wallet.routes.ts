import { Router } from "express";
import {
  authenticate,
  authorize,
  authorizeSellerPortal,
} from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import { recordPayoutSchema } from "../../schemas/wallet.schemas.js";
import {
  getMyWalletController,
  getMyWalletLedgerController,
  listAdminWalletsController,
  getAdminWalletController,
  getAdminWalletLedgerController,
  recordPayoutController,
} from "./wallet.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", authorizeSellerPortal(), getMyWalletController);
router.get("/me/ledger", authorizeSellerPortal(), getMyWalletLedgerController);

router.get("/", authorize([Role.ADMIN]), listAdminWalletsController);

router.get(
  "/:sellerId/ledger",
  authorize([Role.ADMIN]),
  getAdminWalletLedgerController
);

router.get("/:sellerId", authorize([Role.ADMIN]), getAdminWalletController);

router.post(
  "/:sellerId/payout",
  authorize([Role.ADMIN]),
  validate(recordPayoutSchema),
  recordPayoutController
);

export default router;
