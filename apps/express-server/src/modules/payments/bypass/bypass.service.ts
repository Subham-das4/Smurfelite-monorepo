import { OrderStatus } from "../../../types/prisma.js";
import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../../utils/errors.js";
import { isPaymentBypassEnabled } from "../../../lib/payment-bypass.js";
import { fulfillOrder } from "../../orders/fulfillment.service.js";

export async function completeBypassPayment(
  orderId: string,
  userId: string
) {
  if (!isPaymentBypassEnabled()) {
    throw new ApiError("Payment bypass is not enabled.", 403);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new ApiError("Order not found.", 404);
  }

  if (order.buyerId !== userId) {
    throw new ApiError("Forbidden.", 403);
  }

  if (
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.COMPLETED
  ) {
    throw new ApiError(
      "Only pending orders can be completed via payment bypass.",
      400
    );
  }

  const fulfilled = await fulfillOrder(orderId, "bypass");
  if (!fulfilled) {
    throw new ApiError("Order fulfillment failed.", 500);
  }

  return fulfilled;
}
