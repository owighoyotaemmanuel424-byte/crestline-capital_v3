import { describe, expect, test } from "bun:test";
import { evaluateTransferRisk } from "../convex/lib/fraud";

describe("transfer fraud engine", () => {
  test("allows low-risk transfer", () => {
    const result = evaluateTransferRisk({ amount: 100, availableBalance: 10000, accountAgeMs: 10 * 86400000, recentTransferCount: 1, failedTransferCount: 0, beneficiaryKnown: true });
    expect(result.decision).toBe("allow");
    expect(result.score).toBe(0);
  });
  test("reviews a high-utilization new-beneficiary transfer", () => {
    const result = evaluateTransferRisk({ amount: 9000, availableBalance: 10000, accountAgeMs: 2 * 86400000, recentTransferCount: 1, failedTransferCount: 0, beneficiaryKnown: false });
    expect(result.decision).toBe("review");
    expect(result.reasons).toContain("high_balance_utilization");
  });
  test("honors configured thresholds", () => {
    const result = evaluateTransferRisk({ amount: 60000, availableBalance: 100000, accountAgeMs: 30 * 86400000, recentTransferCount: 1, failedTransferCount: 0, beneficiaryKnown: true }, { review: 10, deny: 20 });
    expect(result.decision).toBe("deny");
  });
});
