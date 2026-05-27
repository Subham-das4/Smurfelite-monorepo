import { Request, Response, NextFunction } from "express";
import {
  createProduct,
  updateProduct,
  softDeleteProduct,
  getProductDetails,
  getAllProducts,
  getMyProducts,
  getAdminProducts,
  getAdminProductById,
  publishProduct,
  delistProductBySeller,
  reactivateProductBySeller,
  banProductByAdmin,
  liftBanProductByAdmin,
} from "./product.service.js";
import { ProductFilters } from "../../types/product.types.js";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { Role } from "../../types/prisma.js";
import ApiError from "../../utils/errors.js";
import { ProductErrors } from "./product.messages.js";

function resolveSellerId(req: AuthenticatedRequest, bodySellerId?: string): string {
  if (req.user.role === Role.SELLER) {
    return req.user.id;
  }
  if (req.user.role === Role.ADMIN) {
    if (!bodySellerId) {
      throw new ApiError(
        "Admin must provide sellerId when creating a product.",
        400
      );
    }
    return bodySellerId;
  }
  throw new ApiError(ProductErrors.PRODUCT_FORBIDDEN, 403);
}

export async function createProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { publish, sellerId: bodySellerId, ...productData } = req.body;

    const sellerId = resolveSellerId(authReq, bodySellerId);
    const product = await createProduct(sellerId, productData, { publish });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function publishProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const product = await publishProduct(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function delistProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const product = await delistProductBySeller(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function reactivateProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const product = await reactivateProductBySeller(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function banProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const product = await banProductByAdmin(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function liftBanProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const product = await liftBanProductByAdmin(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

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

    const updatedProduct = await updateProduct(productId, updateData);

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;

    await softDeleteProduct(productId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getProductDetailsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;

    const product = await getProductDetails(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function getMyProductsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req as AuthenticatedRequest;
    const filters: ProductFilters = {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
    } as ProductFilters;
    const result = await getMyProducts(user.id, filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminProductsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters: ProductFilters = {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
    } as ProductFilters;
    const result = await getAdminProducts(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminProductController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const product = await getAdminProductById(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function getAllProductsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters: ProductFilters = {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
    } as ProductFilters;

    const products = await getAllProducts(filters);

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
}
