export type SmokeContext = {
  apiBase: string;
  buyerToken: string;
  buyerId: string;
};

export class SmokeRunner {
  readonly phaseLabel: string;
  private passed = 0;
  private failed = 0;
  private failures: string[] = [];

  constructor(phaseLabel: string) {
    this.phaseLabel = phaseLabel;
  }

  async test(name: string, fn: () => void | Promise<void>): Promise<void> {
    try {
      await fn();
      this.passed += 1;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      this.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      this.failures.push(`${name}: ${message}`);
      console.error(`  ✗ ${name}`);
      console.error(`    → ${message}`);
    }
  }

  assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
  }

  section(title: string): void {
    console.log(`\n── ${title} ──`);
  }

  finishPhase(): boolean {
    console.log(
      `\n[${this.phaseLabel}] ${this.passed} passed, ${this.failed} failed`
    );
    return this.failed === 0;
  }

  static finishAll(phasesOk: boolean[]): void {
    const failed = phasesOk.filter((ok) => !ok).length;
    console.log("\n" + "=".repeat(60));
    if (failed === 0) {
      console.log("ALL SMOKE TESTS PASSED");
      return;
    }
    console.error(`SMOKE TESTS FAILED (${failed} phase group(s))`);
    process.exitCode = 1;
  }
}

export function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

export function assertIncludes(actual: string, substring: string, label: string): void {
  if (!actual.includes(substring)) {
    throw new Error(`${label}: expected to include "${substring}", got "${actual}"`);
  }
}
