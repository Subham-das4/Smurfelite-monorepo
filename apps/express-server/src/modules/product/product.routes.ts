import { Router } from "express";
import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductDetailsController,
  getAllProductsController,
} from "./product.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "@smurfelite/types";
import { verifySeller } from "./product.middleware.js";

const router = Router();

// Get all products (with filters/search)
router.get("/", getAllProductsController);

// Get specific product details
router.get("/:productId", getProductDetailsController);

// Protected routes - require authentication and specific roles
// Note: Every route defined after this middleware will require authentication
router.use(authenticate, authorize([Role.ADMIN, Role.SELLER]));

// 1. Create a new product listing
router.post("/", createProductController);

router.use(verifySeller);

// 2. Update existing product details
router.put("/:productId", updateProductController);

// 3. Delete a product listing
router.delete("/:productId", deleteProductController);

export default router;
