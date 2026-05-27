import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import { sendEnquiryNotificationEmail } from "../../services/email/transactional.service.js";
import logger from "../../utils/logger.js";

export interface CreateEnquiryInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  userId?: string | null;
}

function buildEnquirySubject(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? `Contact from ${trimmed}` : "Website contact enquiry";
}

export const createEnquiry = async (input: CreateEnquiryInput) => {
  const enquiry = await prisma.enquiry.create({
    data: {
      subject: buildEnquirySubject(input.name),
      message: input.message.trim(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      userId: input.userId ?? null,
    },
  });

  try {
    await sendEnquiryNotificationEmail({
      enquiryId: enquiry.id,
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      message: enquiry.message,
      submittedByUserId: enquiry.userId,
    });
  } catch (error) {
    logger.error(
      `Enquiry ${enquiry.id} saved but notification email failed`,
      error
    );
  }

  return enquiry;
};

export const getMyEnquiries = async (userId: string) => {
  return prisma.enquiry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllEnquiries = async (
  page: number = 1,
  pageSize: number = 20,
  includeOpen: boolean = true
) => {
  const skip = (page - 1) * pageSize;
  const where = includeOpen ? {} : { isClosed: false };

  const [enquiries, totalCount] = await prisma.$transaction([
    prisma.enquiry.findMany({
      skip,
      take: pageSize,
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enquiry.count({ where }),
  ]);

  return {
    enquiries,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
};

export const closeEnquiry = async (enquiryId: string) => {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new ApiError("Enquiry not found.", 404);
  if (enquiry.isClosed) throw new ApiError("Enquiry is already closed.", 400);

  return prisma.enquiry.update({
    where: { id: enquiryId },
    data: { isClosed: true },
  });
};

export const deleteEnquiry = async (enquiryId: string) => {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new ApiError("Enquiry not found.", 404);
  await prisma.enquiry.delete({ where: { id: enquiryId } });
};
