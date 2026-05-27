import {
  OrderStatus,
  WalletLedgerType,
  type PrismaClient,
} from "@smurfelite/types/src/generated/prisma/index.js";
import type { Logger } from "winston";

export const HOLD_RELEASE_NOTE_PREFIX = "releaseOf:";

export function holdReleaseNoteForCredit(saleCreditLedgerId: string): string {
  return `${HOLD_RELEASE_NOTE_PREFIX}${saleCreditLedgerId}`;
}

export function getWalletHoldCutoff(holdDays: number): Date {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - holdDays);
  return cutoff;
}

export async function releaseEligibleWalletHolds(
  prisma: PrismaClient,
  holdDays: number,
  logger: Logger
): Promise<{ processed: number; skipped: number }> {
  const cutoff = getWalletHoldCutoff(holdDays);

  const credits = await prisma.walletLedger.findMany({
    where: {
      type: WalletLedgerType.SALE_CREDIT,
      createdAt: { lt: cutoff },
      orderId: { not: null },
    },
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;
  let skipped = 0;

  for (const credit of credits) {
    const releaseNote = holdReleaseNoteForCredit(credit.id);

    const alreadyReleased = await prisma.walletLedger.findFirst({
      where: {
        type: WalletLedgerType.HOLD_RELEASED,
        note: releaseNote,
      },
      select: { id: true },
    });
    if (alreadyReleased) {
      skipped += 1;
      continue;
    }

    if (!credit.orderId) {
      skipped += 1;
      continue;
    }

    const order = await prisma.order.findUnique({
      where: { id: credit.orderId },
      select: { status: true },
    });
    if (!order || order.status !== OrderStatus.COMPLETED) {
      logger.debug(
        `Skipping hold release for ledger ${credit.id}: order ${credit.orderId} status=${order?.status ?? "missing"}`
      );
      skipped += 1;
      continue;
    }

    try {
      const released = await prisma.$transaction(async (tx) => {
        const existing = await tx.walletLedger.findFirst({
          where: { type: WalletLedgerType.HOLD_RELEASED, note: releaseNote },
          select: { id: true },
        });
        if (existing) return false;

        const wallet = await tx.sellerWallet.findUnique({
          where: { userId: credit.walletUserId },
        });
        if (!wallet) {
          logger.warn(
            `Skipping hold release for ledger ${credit.id}: seller wallet missing`
          );
          return false;
        }

        if (wallet.pendingBalance < credit.amount) {
          logger.warn(
            `Skipping hold release for ledger ${credit.id}: pendingBalance ${wallet.pendingBalance} < credit ${credit.amount}`
          );
          return false;
        }

        await tx.sellerWallet.update({
          where: { userId: credit.walletUserId },
          data: {
            pendingBalance: { decrement: credit.amount },
            availableBalance: { increment: credit.amount },
          },
        });

        await tx.walletLedger.create({
          data: {
            walletUserId: credit.walletUserId,
            type: WalletLedgerType.HOLD_RELEASED,
            amount: credit.amount,
            orderId: credit.orderId,
            note: releaseNote,
          },
        });

        return true;
      });

      if (released) {
        processed += 1;
        logger.info(
          `Released hold ${credit.amount} for seller ${credit.walletUserId} (order ${credit.orderId}, credit ${credit.id})`
        );
      } else {
        skipped += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        `Hold release failed for ledger ${credit.id}: ${message}`
      );
      skipped += 1;
    }
  }

  return { processed, skipped };
}
