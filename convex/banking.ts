import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { currentUser, createNotification, writeAudit } from "./lib/auth";
import { evaluateTransferRisk } from "./lib/fraud";

export const dashboard = query({ args: {}, handler: async ctx => {
  const { user } = await currentUser(ctx);
  const accounts = await ctx.db.query("accounts").withIndex("by_user", q => q.eq("userId", user._id)).collect();
  const transactions = await ctx.db.query("transactions").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(20);
  const cards = await ctx.db.query("cards").withIndex("by_user", q => q.eq("userId", user._id)).collect();
  const transfers = await ctx.db.query("transfers").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(10);
  const notifications = await ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(10);
  return { user, accounts, transactions, cards, transfers, notifications };
}});

export const ensureDefaultAccount = mutation({ args: {}, handler: async ctx => {
  const { user, identity } = await currentUser(ctx);
  const existing = await ctx.db.query("accounts").withIndex("by_user", q => q.eq("userId", user._id)).first();
  if (existing) return existing._id;
  const now = Date.now();
  let accountNumber = `${now}`.slice(-10);
  while (await ctx.db.query("accounts").withIndex("by_number", q => q.eq("accountNumber", accountNumber)).unique()) accountNumber = `${now}${Math.floor(Math.random() * 1000)}`.slice(-10);
  const accountId = await ctx.db.insert("accounts", { userId: user._id, type: "checking", balance: 0, availableBalance: 0, currency: "USD", accountNumber, accountNumberMasked: `•••• ${accountNumber.slice(-4)}`, status: "active", createdAt: now, updatedAt: now });
  await writeAudit(ctx, user._id, identity.subject, "account.created", "account", accountId, { type: "checking" });
  await createNotification(ctx, user._id, "account", "Checking account created", `Your checking account ending ${accountNumber.slice(-4)} is ready.`, `account-created:${accountId}`);
  return accountId;
}});

export const transactions = query({ args: { accountId: v.optional(v.id("accounts")) }, handler: async (ctx, { accountId }) => {
  const { user } = await currentUser(ctx);
  if (accountId) { const account = await ctx.db.get(accountId); if (!account || account.userId !== user._id) throw new Error("FORBIDDEN"); }
  return accountId ? await ctx.db.query("transactions").withIndex("by_account", q => q.eq("accountId", accountId)).order("desc").collect() : await ctx.db.query("transactions").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").collect();
}});

export const transfer = mutation({
  args: { sourceAccountId: v.id("accounts"), beneficiaryAccount: v.string(), beneficiaryName: v.string(), amount: v.number(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const { user, identity } = await currentUser(ctx);
    if (user.kycStatus !== "verified") throw new Error("KYC_REQUIRED");
    if (!Number.isFinite(args.amount) || args.amount <= 0 || args.amount > 1000000) throw new Error("INVALID_AMOUNT");
    if (!/^[0-9]{6,20}$/.test(args.beneficiaryAccount)) throw new Error("INVALID_DESTINATION");
    if (args.idempotencyKey.length < 16 || args.idempotencyKey.length > 128) throw new Error("INVALID_IDEMPOTENCY_KEY");
    const duplicate = await ctx.db.query("transfers").withIndex("by_idempotency", q => q.eq("userId", user._id).eq("idempotencyKey", args.idempotencyKey)).unique();
    if (duplicate) return duplicate;
    const source = await ctx.db.get(args.sourceAccountId);
    if (!source || source.userId !== user._id) throw new Error("FORBIDDEN");
    if (source.status !== "active") throw new Error("SOURCE_ACCOUNT_UNAVAILABLE");
    const destination = await ctx.db.query("accounts").withIndex("by_number", q => q.eq("accountNumber", args.beneficiaryAccount)).unique();
    if (!destination || destination.status !== "active") throw new Error("DESTINATION_NOT_FOUND");
    if (destination._id === source._id) throw new Error("SELF_TRANSFER_NOT_ALLOWED");
    if (destination.currency !== source.currency) throw new Error("CURRENCY_MISMATCH");
    if (source.availableBalance < args.amount) throw new Error("INSUFFICIENT_FUNDS");
    const recent = await ctx.db.query("transfers").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(10);
    const failed = recent.filter(t => t.status === "failed").length;
    const accountAgeMs = Date.now() - user.createdAt;
    const beneficiaryKnown = !!(await ctx.db.query("beneficiaries").withIndex("by_account", q => q.eq("accountNumber", args.beneficiaryAccount)).first());
    const risk = evaluateTransferRisk({ amount: args.amount, availableBalance: source.availableBalance, accountAgeMs, recentTransferCount: recent.length, failedTransferCount: failed, beneficiaryKnown });
    const now = Date.now(); const reference = `TRF-${now}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    if (risk.decision === "deny") {
      const transferId = await ctx.db.insert("transfers", { userId: user._id, sourceAccountId: source._id, destinationAccountId: destination._id, beneficiaryName: args.beneficiaryName, beneficiaryAccount: args.beneficiaryAccount, amount: args.amount, currency: source.currency, status: "failed", riskScore: risk.score, riskDecision: risk.decision, riskReasons: risk.reasons, reference, idempotencyKey: args.idempotencyKey, failureCode: "RISK_DENIED", failureMessage: "Transfer declined by risk controls.", createdAt: now, updatedAt: now });
      await ctx.db.insert("fraudEvents", { userId: user._id, transferId, score: risk.score, decision: risk.decision, reasons: risk.reasons, signals: { amount: args.amount, velocity: recent.length, beneficiaryKnown }, createdAt: now });
      await writeAudit(ctx, user._id, identity.subject, "transfer.risk_denied", "transfer", transferId, { score: risk.score, reasons: risk.reasons });
      return { ...await ctx.db.get(transferId), transferId };
    }
    const status = risk.decision === "review" ? "review" : "processing";
    const transferId = await ctx.db.insert("transfers", { userId: user._id, sourceAccountId: source._id, destinationAccountId: destination._id, beneficiaryName: args.beneficiaryName, beneficiaryAccount: args.beneficiaryAccount, amount: args.amount, currency: source.currency, status, riskScore: risk.score, riskDecision: risk.decision, riskReasons: risk.reasons, reference, idempotencyKey: args.idempotencyKey, createdAt: now, updatedAt: now });
    await ctx.db.insert("fraudEvents", { userId: user._id, transferId, score: risk.score, decision: risk.decision, reasons: risk.reasons, signals: { amount: args.amount, velocity: recent.length, beneficiaryKnown }, createdAt: now });
    if (status === "processing") {
      await ctx.db.patch(source._id, { balance: source.balance - args.amount, availableBalance: source.availableBalance - args.amount, updatedAt: now });
      await ctx.db.patch(destination._id, { balance: destination.balance + args.amount, availableBalance: destination.availableBalance + args.amount, updatedAt: now });
      const debit = await ctx.db.insert("transactions", { accountId: source._id, userId: user._id, amount: args.amount, currency: source.currency, category: "Transfer", type: "debit", status: "completed", description: `Transfer to ${args.beneficiaryName}`, reference, createdAt: now, updatedAt: now });
      const credit = await ctx.db.insert("transactions", { accountId: destination._id, userId: destination.userId, amount: args.amount, currency: source.currency, category: "Transfer", type: "credit", status: "completed", description: `Transfer from ${user.name}`, reference, createdAt: now, updatedAt: now });
      await ctx.db.insert("ledgerEntries", { transactionId: debit, accountId: source._id, direction: "debit", amount: args.amount, currency: source.currency, createdAt: now });
      await ctx.db.insert("ledgerEntries", { transactionId: credit, accountId: destination._id, direction: "credit", amount: args.amount, currency: source.currency, createdAt: now });
      await ctx.db.patch(transferId, { status: "completed", updatedAt: now });
      await createNotification(ctx, destination.userId, "transaction", "Incoming transfer", `${args.amount.toFixed(2)} ${source.currency} received from ${user.name}.`, `transfer-credit:${reference}`);
    }
    await createNotification(ctx, user._id, "transaction", status === "review" ? "Transfer under review" : "Transfer completed", `${args.amount.toFixed(2)} ${source.currency} to ${args.beneficiaryName}.`, `transfer-status:${reference}`);
    await writeAudit(ctx, user._id, identity.subject, "transfer.created", "transfer", transferId, { status, score: risk.score, reference });
    return await ctx.db.get(transferId);
  },
});

export const toggleCard = mutation({ args: { cardId: v.id("cards") }, handler: async (ctx, { cardId }) => {
  const { user, identity } = await currentUser(ctx); const card = await ctx.db.get(cardId);
  if (!card || card.userId !== user._id) throw new Error("FORBIDDEN");
  const isFrozen = !card.isFrozen; await ctx.db.patch(cardId, { isFrozen, updatedAt: Date.now() });
  await writeAudit(ctx, user._id, identity.subject, isFrozen ? "card.frozen" : "card.unfrozen", "card", cardId, {});
  await createNotification(ctx, user._id, "security", isFrozen ? "Card frozen" : "Card unfrozen", `Card ending ${card.last4} is now ${isFrozen ? "frozen" : "active"}.`, `card-state:${cardId}:${isFrozen}`);
  return isFrozen;
}});
