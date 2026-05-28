import "dotenv/config";
import prisma from "../src/lib/prisma.js";
import * as P from "../src/types/prisma.js";

const result = await prisma.user.updateMany({
  where: {
    role: P.Role.SELLER,
    sellerApprovalStatus: P.SellerApprovalStatus.NONE,
  },
  data: {
    sellerApprovalStatus: P.SellerApprovalStatus.APPROVED,
    sellerApprovedAt: new Date(),
  },
});

console.log(`Backfilled ${result.count} seller(s) to APPROVED`);
await prisma.$disconnect();
