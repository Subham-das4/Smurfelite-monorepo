import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { checkProductOwnership } from "./product.service.js";
import * as PrismaNamespace from "../../types/prisma.js";
import { ProductErrors } from "./product.messages.js";
import ApiError from "../../utils/errors.js";

export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId } = req.params;
    const sellerId = authReq.user?.id;

    if (authReq.user?.role === PrismaNamespace.Role.ADMIN) {
      next();
      return;
    }

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    const isAuthorizedSeller = await checkProductOwnership(productId, sellerId);

    if (!isAuthorizedSeller) {
      return res.status(403).json({ error: ProductErrors.PRODUCT_FORBIDDEN });
    }

    next();
  } catch (error) {
    next(new ApiError(ProductErrors.PRODUCT_AUTHORIZATION_FAILED, 403));
  }
};
