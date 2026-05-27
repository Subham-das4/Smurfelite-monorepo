import { Request, Response, NextFunction } from "express";
import {
  getAllGameCategories,
  getGameCategoryById,
  createGameCategory,
  updateGameCategory,
  deleteGameCategory,
  setGameCategoryRestricted,
} from "./game-category.service.js";

export async function getAllGameCategoriesController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await getAllGameCategories();
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function getGameCategoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const category = await getGameCategoryById(req.params.categoryId);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
}

export async function createGameCategoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const category = await createGameCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function updateGameCategoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const category = await updateGameCategory(req.params.categoryId, req.body);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
}

export async function deleteGameCategoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteGameCategory(req.params.categoryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function restrictGameCategoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const category = await setGameCategoryRestricted(
      req.params.categoryId,
      req.body.isRestricted
    );
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
}
