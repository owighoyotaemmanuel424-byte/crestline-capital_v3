export type RiskInput = { amount: number; availableBalance: number; accountAgeMs: number; recentTransferCount: number; failedTransferCount: number; beneficiaryKnown: boolean };
export type RiskResult = { score: number; decision: "allow" | "review" | "deny"; reasons: string[] };

export function evaluateTransferRisk(input: RiskInput): RiskResult {
  let score = 0;
  const reasons: string[] = [];
  if (input.amount > 10000) { score += 25; reasons.push("amount_above_10k"); }
  if (input.amount > 50000) { score += 35; reasons.push("amount_above_50k"); }
  if (input.availableBalance > 0 && input.amount / input.availableBalance >= 0.8) { score += 20; reasons.push("high_balance_utilization"); }
  if (input.accountAgeMs < 24 * 60 * 60 * 1000) { score += 25; reasons.push("new_account"); }
  if (input.recentTransferCount >= 5) { score += 15; reasons.push("high_transfer_velocity"); }
  if (input.failedTransferCount >= 2) { score += 20; reasons.push("recent_failed_transfers"); }
  if (!input.beneficiaryKnown) { score += 10; reasons.push("new_beneficiary"); }
  const decision = score >= 70 ? "deny" : score >= 40 ? "review" : "allow";
  return { score: Math.min(score, 100), decision, reasons };
}
