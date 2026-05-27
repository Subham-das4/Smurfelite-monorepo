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
  | "5.3";

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
  5.2  Game categories — admin CRUD + restrict listings
  5.3  Admin seller delist / reactivate cascade

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

function parseTargetPhase(args: string[]): SmokePhase {
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
  const toRun =
    mode === "phase" ? [target] : phasesUpTo(target);

  console.log("SmurfElite smoke tests");
  console.log(`API: ${getApiBase()}`);
  console.log(`Running phases: ${toRun.join(" → ")}`);

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
  for (const phase of toRun) {
    try {
      results.push(await RUNNERS[phase](ctx));
    } catch (err) {
      console.error(`\nPhase ${phase} crashed:`, err);
      results.push(false);
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
