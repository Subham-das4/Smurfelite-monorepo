import { prisma } from "../../src/lib/prisma.js";
import { SmokeRunner } from "./lib/runner.mts";
import type { SmokeContext } from "./lib/runner.mts";
import { createBuyerContext, getApiBase } from "./lib/http.mts";
import { countPurchasableProducts, prepareSmokeEnvironment } from "./lib/helpers.mts";
import { runPhase1 } from "./phases/phase-1.mts";
import { runPhase2_1 } from "./phases/phase-2_1.mts";
import { runPhase2_2 } from "./phases/phase-2_2.mts";
import { runPhase2_3 } from "./phases/phase-2_3.mts";
import { runPhase2_5 } from "./phases/phase-2_5.mts";
import { runPhase3_1 } from "./phases/phase-3_1.mts";
import { runPhase3_2 } from "./phases/phase-3_2.mts";
import { runPhase3_3 } from "./phases/phase-3_3.mts";
import { runPhase4_2 } from "./phases/phase-4_2.mts";
import { runPhase4_3 } from "./phases/phase-4_3.mts";
import { runPhase4_4 } from "./phases/phase-4_4.mts";
import { runPhase5_1 } from "./phases/phase-5_1.mts";
import { runPhase5_2 } from "./phases/phase-5_2.mts";
import { runPhase5_3 } from "./phases/phase-5_3.mts";
import { runPhase5_4 } from "./phases/phase-5_4.mts";
import { runPhase5_5 } from "./phases/phase-5_5.mts";
import { runPhase5_6 } from "./phases/phase-5_6.mts";
import { runPhase5_8 } from "./phases/phase-5_8.mts";
import { runPhase5_9 } from "./phases/phase-5_9.mts";
import { runPhase5_10 } from "./phases/phase-5_10.mts";
import { runPhase10_2 } from "./phases/phase-10_2.mts";
import { runPhase10_3 } from "./phases/phase-10_3.mts";
import { runPhase10_4 } from "./phases/phase-10_4.mts";
import { runPhase10_5 } from "./phases/phase-10_5.mts";
import { runPhase10_5_3_4 } from "./phases/phase-10_5_3-4.mts";
import { runPhase10_6_4 } from "./phases/phase-10_6_4.mts";
import { runPhase10_9 } from "./phases/phase-10_9.mts";
import { runPhase10 } from "./phases/phase-10.mts";

/** Cumulative Phase 10 epic (orchestrates 10.3–10.9); not in PHASE_ORDER. */
export type SmokeCumulativePhase = "10";

export type SmokePhase =
  | "1"
  | "2.1"
  | "2.2"
  | "2.3"
  | "2.5"
  | "3.1"
  | "3.2"
  | "3.3"
  | "4.2"
  | "4.3"
  | "4.4"
  | "5.1"
  | "5.2"
  | "5.3"
  | "5.4"
  | "5.5"
  | "5.6"
  | "5.8"
  | "5.9"
  | "5.10"
  | "10.2"
  | "10.3"
  | "10.4"
  | "10.5"
  | "10.5.3-4"
  | "10.6.4"
  | "10.9";

const PHASE_ORDER: SmokePhase[] = [
  "1",
  "2.1",
  "2.2",
  "2.3",
  "2.5",
  "3.1",
  "3.2",
  "3.3",
  "4.2",
  "4.3",
  "4.4",
  "5.1",
  "5.2",
  "5.3",
  "5.4",
  "5.5",
  "5.6",
  "5.8",
  "5.9",
  "5.10",
  "10.2",
  "10.3",
  "10.4",
  "10.5",
  "10.5.3-4",
  "10.6.4",
  "10.9",
];

const RUNNERS: Record<SmokePhase, (ctx: SmokeContext) => Promise<boolean>> = {
  "1": runPhase1,
  "2.1": runPhase2_1,
  "2.2": runPhase2_2,
  "2.3": runPhase2_3,
  "2.5": runPhase2_5,
  "3.1": runPhase3_1,
  "3.2": runPhase3_2,
  "3.3": runPhase3_3,
  "4.2": runPhase4_2,
  "4.3": runPhase4_3,
  "4.4": runPhase4_4,
  "5.1": runPhase5_1,
  "5.2": runPhase5_2,
  "5.3": runPhase5_3,
  "5.4": runPhase5_4,
  "5.5": runPhase5_5,
  "5.6": runPhase5_6,
  "5.8": runPhase5_8,
  "5.9": runPhase5_9,
  "5.10": runPhase5_10,
  "10.2": runPhase10_2,
  "10.3": runPhase10_3,
  "10.4": runPhase10_4,
  "10.5": runPhase10_5,
  "10.5.3-4": runPhase10_5_3_4,
  "10.6.4": runPhase10_6_4,
  "10.9": runPhase10_9,
};

function printUsage(): void {
  console.log(`
SmurfElite cumulative smoke tests (Phase 1 → target phase)

Usage:
  tsx --env-file=.env scripts/smoke/run.mts through <phase>
  tsx --env-file=.env scripts/smoke/run.mts phase <phase>

Phases:
  1    Schema & foundations
  2.1  Payment bypass
  2.2  Order fulfillment
  2.3  Cart & checkout fixes
  2.5  Order expiry (pending timeout)
  3.1  SMTP email module
  3.2  Transactional emails (verify, reset, purchase)
  3.3  Enquiry fix (guest contact form + help@ notification)
  4.2  Buyer disputes (POST /disputes + /disputes/mine)
  4.3  Product detail API contract (no mock reviews)
  4.4  Checkout UX — unavailable products + bypass status
  5.1  Product lifecycle — draft, publish, delist, ban, soft delete
  5.2  Games & platforms — admin CRUD + restrict listings
  5.3  Admin seller delist / reactivate cascade
  5.4  Users — admin search, detail, seller products
  5.5  Disputes — admin list, resolve, wallet freeze
  5.6  Wallet — seller balance, payout, sale credits
  5.8  Auth hardening — BUYER-only register, promote seller
  5.9  Payment status — IPN mapping + order paymentStatus
  5.10 Portal API — products/mine, products/admin, orders/seller, wallet ledger, admin credentials
  10.2 JWT actingAs — portal context on tokens, buyer/seller route guards, refresh
  10.3 Portal auth APIs — split login, isolated password reset, register guard
  10.4 Admin provisioning — POST/GET/DELETE /admins, role patch lockdown
  10.5 Seller apply & admin seller API — apply, invite, approve, reject
  10.5.3-4 Promote removal + storefront listing gate
  10.6.4 Admin seller UI contract — APPROVED/REJECTED lists, governance guards
  10.9 Route guards — cross-portal token rejection matrix
  10    Cumulative Phase 10 (10.3 + 10.4 + 10.5 + 10.5.3-4 + 10.9)

Examples:
  pnpm smoke:through-1      # Phase 1 only
  pnpm smoke:through-2.1    # Phase 1 + 2.1
  pnpm smoke:through-2.3    # Phase 1 through 2.3
  pnpm smoke:through-2.5    # Phase 1 through 2.5
  pnpm smoke:through-3.1    # Phase 1 through 3.1
  pnpm smoke:through-3.2    # Phase 1 through 3.2
  pnpm smoke:through-3.3    # Phase 1 through 3.3
  pnpm smoke:through-4.2    # Phase 1 through 4.2
  pnpm smoke:through-4.4    # Phase 1 through 4.4 (full buyer polish API)
  pnpm smoke:through-5.1    # Phase 1 through 5.1 (product lifecycle API)
  pnpm smoke:through-5.3    # Phase 1 through 5.3 (categories + seller admin)
  pnpm smoke:through-5.5    # Phase 1 through 5.5
  pnpm smoke:through-5.9    # Phase 1 through 5.9
  pnpm smoke:through-5.10   # Phase 1 through 5.10 (portal APIs)
  pnpm smoke:phase-2.5      # Phase 2.5 only (no prior phases)
  pnpm smoke:phase-3.1      # Phase 3.1 only
  pnpm smoke:phase-3.2      # Phase 3.2 only
  pnpm smoke:phase-3.3      # Phase 3.3 only
  pnpm smoke:phase-4.2      # Phase 4.2 only
  pnpm smoke:phase-4.3      # Phase 4.3 only
  pnpm smoke:phase-4.4      # Phase 4.4 only
  pnpm smoke:phase-5.1      # Phase 5.1 only
  pnpm smoke:phase-5.2      # Phase 5.2 only
  pnpm smoke:phase-5.3      # Phase 5.3 only
  pnpm smoke:phase-5.4      # Phase 5.4 only
  pnpm smoke:phase-5.5      # Phase 5.5 only
  pnpm smoke:phase-5.6      # Phase 5.6 only
  pnpm smoke:phase-5.8      # Phase 5.8 only
  pnpm smoke:phase-5.9      # Phase 5.9 only
  pnpm smoke:phase-10.2     # Phase 10.2 only (JWT actingAs)
  pnpm smoke:phase-10.3     # Phase 10.3 only (portal auth APIs)
  pnpm smoke:phase-10.4     # Phase 10.4 only (admin provisioning API)
  pnpm smoke:through-10.4   # Phase 1 through 10.4
  pnpm smoke:phase-10.5     # Phase 10.5 only (seller apply & approval API)
  pnpm smoke:through-10.5   # Phase 1 through 10.5
  pnpm smoke:phase-10.5.3-4 # Phase 10.5.3-4 only (listing gate)
  pnpm smoke:through-10.5.3-4 # Phase 1 through 10.5.3-4
  pnpm smoke:phase-10.6.4     # Phase 10.6.4 only (seller governance UI contract)
  pnpm smoke:through-10.6.4   # Phase 1 through 10.6.4
  pnpm smoke:phase-10.9       # Phase 10.9 only (route guards)
  pnpm smoke:phase-10         # Cumulative Phase 10 epic (not phases 1–5)
  pnpm smoke:through-10       # Alias for smoke:phase-10

Environment:
  SMOKE_API_BASE     API base URL (default: http://localhost:\${PORT}/api)
  SMOKE_BUYER_EMAIL  Test buyer email (default: buyer@buyer.com)
  SMOKE_BUYER_PASSWORD
  SMOKE_SELLER_EMAIL Test seller (default: seller@seller.com)
  SMOKE_SELLER_PASSWORD
  SMOKE_ADMIN_EMAIL  Test admin (default: admin@admin.com)
  SMOKE_ADMIN_PASSWORD
  PAYMENT_BYPASS     Must be true for phase 2.1 / 2.3 bypass tests

Requires: express-server running and PostgreSQL seeded with buyer@buyer.com
          (seller@seller.com and admin@admin.com auto-created in dev on startup)
`);
}

function parseTargetPhase(
  args: string[]
): SmokePhase | SmokeCumulativePhase {
  const mode = args[0];
  const phaseArg = args[1];

  if (!mode || mode === "--help" || mode === "-h") {
    printUsage();
    process.exit(0);
  }

  if ((mode !== "through" && mode !== "phase") || !phaseArg) {
    printUsage();
    process.exit(1);
  }

  if (phaseArg === "10") {
    return "10";
  }

  if (!PHASE_ORDER.includes(phaseArg as SmokePhase)) {
    console.error(`Unknown phase: ${phaseArg}`);
    process.exit(1);
  }

  return phaseArg as SmokePhase;
}

function phasesUpTo(target: SmokePhase): SmokePhase[] {
  const idx = PHASE_ORDER.indexOf(target);
  return PHASE_ORDER.slice(0, idx + 1);
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  const target = parseTargetPhase(process.argv.slice(2));

  console.log("SmurfElite smoke tests");
  console.log(`API: ${getApiBase()}`);

  if (target === "10") {
    console.log(
      "Running phases: 10 (cumulative: 10.3 → 10.4 → 10.5 → 10.5.3-4 → 10.9)"
    );
  } else {
    const toRun =
      mode === "phase" ? [target] : phasesUpTo(target);
    console.log(`Running phases: ${toRun.join(" → ")}`);
  }

  await prepareSmokeEnvironment();
  const purchasable = await countPurchasableProducts();
  console.log(`Purchasable products (UUID): ${purchasable}`);
  if (purchasable < 3) {
    console.warn(
      "Warning: fewer than 3 purchasable UUID products — some order tests may fail. Re-seed or add products."
    );
  }

  const ctx = await createBuyerContext();

  const results: boolean[] = [];
  if (target === "10") {
    try {
      results.push(await runPhase10(ctx));
    } catch (err) {
      console.error("\nPhase 10 cumulative crashed:", err);
      results.push(false);
    }
  } else {
    const toRun =
      mode === "phase" ? [target] : phasesUpTo(target);
    for (const phase of toRun) {
      try {
        results.push(await RUNNERS[phase](ctx));
      } catch (err) {
        console.error(`\nPhase ${phase} crashed:`, err);
        results.push(false);
      }
    }
  }

  SmokeRunner.finishAll(results);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
