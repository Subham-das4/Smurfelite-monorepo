import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import ApiError from "../../utils/errors.js";
import {
  createEnquiry,
  getMyEnquiries,
  getAllEnquiries,
  closeEnquiry,
  deleteEnquiry,
} from "./enquiry.service.js";

export const createEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { subject, message } = req.body;
    if (!subject || !message) {
      throw new ApiError("Subject and message are required.", 400);
    }
    const enquiry = await createEnquiry(user.id, subject, message);
    res.status(201).json(enquiry);
  } catch (error) {
    next(error);
  }
};

export const getMyEnquiriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const enquiries = await getMyEnquiries(user.id);
    res.status(200).json(enquiries);
  } catch (error) {
    next(error);
  }
};

export const getAllEnquiriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const includeOpen = req.query.includeOpen !== "false";
    const result = await getAllEnquiries(page, pageSize, includeOpen);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const closeEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const enquiry = await closeEnquiry(req.params.enquiryId);
    res.status(200).json(enquiry);
  } catch (error) {
    next(error);
  }
};

export const deleteEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteEnquiry(req.params.enquiryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
