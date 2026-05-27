import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { Role } from "../../types/prisma.js";
import {
  getMe,
  updateMe,
  changePassword,
  searchUsers,
  getUserByIdAdmin,
  getUserProductsAdmin,
  updateUserRole,
  deleteUser,
  delistSellerByAdmin,
  reactivateSellerByAdmin,
} from "./user.service.js";
import ApiError from "../../utils/errors.js";

export const getMeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const result = await getMe(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateMeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { name, googleProfilePicture } = req.body;
    const result = await updateMe(user.id, { name, googleProfilePicture });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError("currentPassword and newPassword are required.", 400);
    }
    await changePassword(user.id, currentPassword, newPassword);
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await searchUsers(page, pageSize, search);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getUserByIdAdmin(req.params.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await getUserProductsAdmin(
      req.params.userId,
      page,
      pageSize
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateUserRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body;
    const result = await updateUserRole(req.params.userId, role as Role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const delistSellerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await delistSellerByAdmin(req.params.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const reactivateSellerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await reactivateSellerByAdmin(req.params.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    await deleteUser(user.id, req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
