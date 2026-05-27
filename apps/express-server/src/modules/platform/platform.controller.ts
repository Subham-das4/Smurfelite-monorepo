import { Request, Response, NextFunction } from "express";
import {
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
  setPlatformRestricted,
} from "./platform.service.js";

export async function getAllPlatformsController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const platforms = await getAllPlatforms();
    res.status(200).json({ platforms });
  } catch (error) {
    next(error);
  }
}

export async function getPlatformController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const platform = await getPlatformById(req.params.platformId);
    res.status(200).json(platform);
  } catch (error) {
    next(error);
  }
}

export async function createPlatformController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const platform = await createPlatform(req.body);
    res.status(201).json(platform);
  } catch (error) {
    next(error);
  }
}

export async function updatePlatformController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const platform = await updatePlatform(req.params.platformId, req.body);
    res.status(200).json(platform);
  } catch (error) {
    next(error);
  }
}

export async function deletePlatformController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deletePlatform(req.params.platformId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function restrictPlatformController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const platform = await setPlatformRestricted(
      req.params.platformId,
      req.body.isRestricted
    );
    res.status(200).json(platform);
  } catch (error) {
    next(error);
  }
}
