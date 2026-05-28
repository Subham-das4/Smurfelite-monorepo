import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import {
  createAdmin,
  listAdmins,
  deleteAdmin,
} from "./admin.service.js";

export async function createAdminController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { email, name } = req.body;
    const admin = await createAdmin(user.id, { email, name });
    res.status(201).json({ admin });
  } catch (error) {
    next(error);
  }
}

export async function listAdminsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await listAdmins(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    await deleteAdmin(user.id, req.params.adminId);
    res.status(200).json({ message: "Admin removed." });
  } catch (error) {
    next(error);
  }
}
