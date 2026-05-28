import type { SmokeContext } from "../lib/runner.mts";
import { runPhase10_3 } from "./phase-10_3.mts";
import { runPhase10_4 } from "./phase-10_4.mts";
import { runPhase10_5 } from "./phase-10_5.mts";
import { runPhase10_5_3_4 } from "./phase-10_5_3-4.mts";
import { runPhase10_9 } from "./phase-10_9.mts";

/** Cumulative Phase 10 acceptance — orchestrates 10.3, 10.4, 10.5, 10.5.3-4, 10.9. */
export async function runPhase10(ctx: SmokeContext): Promise<boolean> {
  console.log("\n" + "=".repeat(60));
  console.log(
    "Phase 10 — Cumulative acceptance (10.3 → 10.4 → 10.5 → 10.5.3-4 → 10.9)"
  );
  console.log("=".repeat(60));

  const results = [
    await runPhase10_3(ctx),
    await runPhase10_4(ctx),
    await runPhase10_5(ctx),
    await runPhase10_5_3_4(ctx),
    await runPhase10_9(ctx),
  ];

  const allOk = results.every(Boolean);
  console.log(
    `\n[Phase 10 cumulative] ${results.filter(Boolean).length}/${results.length} sub-phases passed`
  );
  return allOk;
}
