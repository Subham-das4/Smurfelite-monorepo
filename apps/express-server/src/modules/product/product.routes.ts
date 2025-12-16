import { Router } from "express";
import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductDetailsController,
  getAllProductsController,
} from "./product.controller.js";

const router = Router();

// Get all products (with filters/search)
router.get("/", getAllProductsController);

// Get specific product details
router.get("/:productId", getProductDetailsController);

// 1. Create a new product listing
router.post(
  "/",
  // [authMiddleware, sellerMiddleware], // Placeholder for security
  createProductController
);

// 2. Update existing product details
router.put(
  "/:productId",
  // [authMiddleware, sellerMiddleware],
  updateProductController
);

// 3. Delete a product listing
router.delete(
  "/:productId",
  // [authMiddleware, sellerMiddleware],
  deleteProductController
);

export default router;
