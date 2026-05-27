import { Request, Response, NextFunction } from "express";
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  setGameRestricted,
} from "./game.service.js";

export async function getAllGamesController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const games = await getAllGames();
    res.status(200).json({ games });
  } catch (error) {
    next(error);
  }
}

export async function getGameController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const game = await getGameById(req.params.gameId);
    res.status(200).json(game);
  } catch (error) {
    next(error);
  }
}

export async function createGameController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const game = await createGame(req.body);
    res.status(201).json(game);
  } catch (error) {
    next(error);
  }
}

export async function updateGameController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const game = await updateGame(req.params.gameId, req.body);
    res.status(200).json(game);
  } catch (error) {
    next(error);
  }
}

export async function deleteGameController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteGame(req.params.gameId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function restrictGameController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const game = await setGameRestricted(
      req.params.gameId,
      req.body.isRestricted
    );
    res.status(200).json(game);
  } catch (error) {
    next(error);
  }
}
