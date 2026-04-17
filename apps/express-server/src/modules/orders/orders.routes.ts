import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../../schemas/order.schemas.js";
import {
  createOrderController,
  getOrderByIdController,
  getBuyerOrdersController,
  getAllOrdersController,
  updateOrderStatusController,
  cancelOrderController,
  getOrderCredentialsController,
} from "./orders.controllers.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// POST /api/orders — Buyer creates a new order from productIds
router.post("/", authorize([Role.BUYER]), validate(createOrderSchema), createOrderController);

// GET /api/orders — Buyer gets their own orders
router.get("/", authorize([Role.BUYER]), getBuyerOrdersController);

// GET /api/orders/all — Admin gets all orders
router.get("/all", authorize([Role.ADMIN]), getAllOrdersController);

// GET /api/orders/:orderId — Get single order (buyer owns it or admin)
router.get("/:orderId", getOrderByIdController);

// GET /api/orders/:orderId/credentials — Buyer retrieves decrypted account credentials (COMPLETED orders only)
router.get(
  "/:orderId/credentials",
  authorize([Role.BUYER]),
  getOrderCredentialsController
);

// PATCH /api/orders/:orderId/status — Admin updates order status
router.patch(
  "/:orderId/status",
  authorize([Role.ADMIN]),
  validate(updateOrderStatusSchema),
  updateOrderStatusController
);

// PATCH /api/orders/:orderId/cancel — Buyer cancels a PENDING order
router.patch("/:orderId/cancel", authorize([Role.BUYER]), cancelOrderController);

export default router;
