import { Request, Response, NextFunction } from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  getAllProducts,
} from "./product.service.js";
import { ProductFilters } from "../../types/product.types.ts";

// --- 1. Create Product ---
export async function createProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.body.sellerId) {
      return res
        .status(401)
        .json({ error: "Authentication required: Seller ID missing." });
    }

    const product = await createProduct(req.body);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

// --- 2. Update Product Details ---
export async function updateProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided." });
    }

    // The service will handle authorization (e.g., ensuring req.body.sellerId matches product.sellerId)
    const updatedProduct = await updateProduct(productId, updateData);

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
}

// --- 3. Delete Product Details ---
export async function deleteProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;

    await deleteProduct(productId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// --- 4. Get Product Details (Public/Seller View) ---
export async function getProductDetailsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;

    // NOTE: The service decides whether to return encrypted (public) or decrypted (seller/buyer) data.
    const product = await getProductDetails(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

// --- 5. Get All Products with Filters (Public Listing) ---
export async function getAllProductsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // req.query will contain filters like gameType, priceRange, etc.
    const filters: ProductFilters = {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    } as ProductFilters;

    const products = await getAllProducts(filters);

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
}
