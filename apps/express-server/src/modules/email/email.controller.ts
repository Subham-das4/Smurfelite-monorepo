import { Request, Response } from "express";
import { getEmailModuleStatus } from "../../services/email.service.js";

export const emailStatusController = (_req: Request, res: Response) => {
  res.status(200).json(getEmailModuleStatus());
};
