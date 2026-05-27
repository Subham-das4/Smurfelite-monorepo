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

export type SmokePhase = "1" | "2.1" | "2.2" | "2.3" | "2.5" | "3.1" | "3.2";

const PHASE_ORDER: SmokePhase[] = ["1", "2.1", "2.2", "2.3", "2.5", "3.1", "3.2"];

const RUNNERS: Record<SmokePhase, (ctx: SmokeContext) => Promise<boolean>> = {
  "1": runPhase1,
  "2.1": runPhase2_1,
  "2.2": runPhase2_2,
  "2.3": runPhase2_3,
  "2.5": runPhase2_5,
  "3.1": runPhase3_1,
  "3.2": runPhase3_2,
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

Examples:
  pnpm smoke:through-1      # Phase 1 only
  pnpm smoke:through-2.1    # Phase 1 + 2.1
  pnpm smoke:through-2.3    # Phase 1 through 2.3
  pnpm smoke:through-2.5    # Phase 1 through 2.5
  pnpm smoke:through-3.1    # Phase 1 through 3.1
  pnpm smoke:through-3.2    # Phase 1 through 3.2
  pnpm smoke:phase-2.5      # Phase 2.5 only (no prior phases)
  pnpm smoke:phase-3.1      # Phase 3.1 only
  pnpm smoke:phase-3.2      # Phase 3.2 only

Environment:
  SMOKE_API_BASE     API base URL (default: http://localhost:\${PORT}/api)
  SMOKE_BUYER_EMAIL  Test buyer email (default: buyer@buyer.com)
  SMOKE_BUYER_PASSWORD
  PAYMENT_BYPASS     Must be true for phase 2.1 / 2.3 bypass tests

Requires: express-server running and PostgreSQL seeded with buyer@buyer.com
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
