import { prisma } from "../src/lib/prisma.js";
import { createOrder } from "../src/modules/orders/orders.services.js";
import { completeBypassPayment } from "../src/modules/payments/bypass/bypass.service.js";
import { isPaymentBypassEnabled } from "../src/lib/payment-bypass.js";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "../src/types/prisma.js";

async function main() {
  const buyer = await prisma.user.findUnique({
    where: { email: "buyer@buyer.com" },
  });
  if (!buyer) throw new Error("buyer not found");
  console.log("bypass enabled:", isPaymentBypassEnabled());

  const product = await prisma.product.findFirst({
    where: {
      status: ProductStatus.ACTIVE,
      sellerDelisted: false,
      isAvailable: true,
      deletedAt: null,
      transactionBlock: false,
    },
  });
  if (!product) throw new Error("no purchasable product");
  console.log("product:", product.id, product.title);

  const order = await createOrder(buyer.id, [product.id]);
  console.log("order created:", order.id, order.status);

  const fulfilled = await completeBypassPayment(order.id, buyer.id);
  console.log(
    "fulfilled:",
    fulfilled?.status,
    fulfilled?.paymentStatus,
    fulfilled?.paymentProvider
  );

  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id },
  });
  console.log(
    "product after:",
    updatedProduct?.status,
    updatedProduct?.isAvailable,
    updatedProduct?.transactionBlock
  );

  const wallet = await prisma.sellerWallet.findUnique({
    where: { userId: product.sellerId },
  });
  console.log("seller pendingBalance:", wallet?.pendingBalance?.toString());

  if (fulfilled?.status !== OrderStatus.COMPLETED) {
    throw new Error("order not COMPLETED");
  }
  if (fulfilled?.paymentStatus !== PaymentStatus.PAID) {
    throw new Error("payment not PAID");
  }
  if (updatedProduct?.status !== ProductStatus.SOLD) {
    throw new Error("product not SOLD");
  }
  console.log("PHASE 2.1 SMOKE OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
