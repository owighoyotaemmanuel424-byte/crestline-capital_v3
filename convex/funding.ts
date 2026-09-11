import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createNotification, currentUser, requireRole, writeAudit } from "./lib/auth";

const staffRoles = ["operator", "admin"] as const;

function validateAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) throw new Error("INVALID_AMOUNT");
}

export const myRequests = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await currentUser(ctx);
    const deposits = await ctx.db.query("depositRequests").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(50);
    const withdrawals = await ctx.db.query("withdrawalRequests").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(50);
    return { deposits, withdrawals };
  },
});

export const requestDeposit = mutation({
  args: { accountId: v.id("accounts"), amount: v.number() },
  handler: async (ctx, args) => {
    const { user, identity } = await currentUser(ctx);
    validateAmount(args.amount);
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) throw new Error("FORBIDDEN");
    if (account.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
    const now = Date.now();
    const reference = `DEP-${now}-${args.accountId.slice(-6).toUpperCase()}`;
    const id = await ctx.db.insert("depositRequests", { userId: user._id, accountId: account._id, amount: args.amount, currency: account.currency, status: "pending", reference, createdAt: now, updatedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "deposit.requested", "deposit", id, { amount: args.amount, reference });
    await createNotification(ctx, user._id, "transaction", "Deposit request submitted", `Your ${args.amount.toFixed(2)} ${account.currency} deposit request is pending review.`, `deposit-request:${id}`);
    return await ctx.db.get(id);
  },
});

export const requestWithdrawal = mutation({
  args: { accountId: v.id("accounts"), amount: v.number() },
  handler: async (ctx, args) => {
    const { user, identity } = await currentUser(ctx);
    validateAmount(args.amount);
    if (user.accountStatus !== "active") throw new Error("ACCOUNT_RESTRICTED");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) throw new Error("FORBIDDEN");
    if (account.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
    if (account.availableBalance < args.amount) throw new Error("INSUFFICIENT_FUNDS");
    const now = Date.now();
    const reference = `WDR-${now}-${args.accountId.slice(-6).toUpperCase()}`;
    const id = await ctx.db.insert("withdrawalRequests", { userId: user._id, accountId: account._id, amount: args.amount, currency: account.currency, status: "pending", reference, createdAt: now, updatedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "withdrawal.requested", "withdrawal", id, { amount: args.amount, reference });
    await createNotification(ctx, user._id, "transaction", "Withdrawal request submitted", `Your ${args.amount.toFixed(2)} ${account.currency} withdrawal request is pending review.`, `withdrawal-request:${id}`);
    return await ctx.db.get(id);
  },
});

export const fundingQueue = query({
  args: { type: v.union(v.literal("deposit"), v.literal("withdrawal")) },
  handler: async (ctx, args) => {
    await requireRole(ctx, [...staffRoles]);
    if (args.type === "deposit") return await ctx.db.query("depositRequests").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").take(100);
    return await ctx.db.query("withdrawalRequests").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").take(100);
  },
});

export const approveDeposit = mutation({
  args: { requestId: v.id("depositRequests"), note: v.string() },
  handler: async (ctx, args) => {
    const { user, identity } = await requireRole(ctx, [...staffRoles]);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("INVALID_REQUEST_STATE");
    const account = await ctx.db.get(request.accountId);
    if (!account || account.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", { accountId: account._id, userId: account.userId, amount: request.amount, currency: request.currency, category: "Deposit", type: "credit", status: "completed", description: "Deposit approved by Crestline Capital operations", reference: request.reference, createdAt: now, updatedAt: now });
    await ctx.db.insert("ledgerEntries", { transactionId, accountId: account._id, direction: "credit", amount: request.amount, currency: request.currency, createdAt: now });
    await ctx.db.patch(account._id, { balance: account.balance + request.amount, availableBalance: account.availableBalance + request.amount, updatedAt: now });
    await ctx.db.patch(request._id, { status: "approved", reviewedBy: user._id, reviewNote: args.note.slice(0, 500), updatedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "deposit.approved", "deposit", request._id, { amount: request.amount, reference: request.reference, note: args.note.slice(0, 500) });
    await createNotification(ctx, request.userId, "transaction", "Deposit approved", `${request.amount.toFixed(2)} ${request.currency} has been credited to your account.`, `deposit-approved:${request._id}`);
    return await ctx.db.get(request._id);
  },
});

export const approveWithdrawal = mutation({
  args: { requestId: v.id("withdrawalRequests"), note: v.string() },
  handler: async (ctx, args) => {
    const { user, identity } = await requireRole(ctx, [...staffRoles]);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("INVALID_REQUEST_STATE");
    const account = await ctx.db.get(request.accountId);
    if (!account || account.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
    if (account.availableBalance < request.amount) throw new Error("INSUFFICIENT_FUNDS");
    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", { accountId: account._id, userId: account.userId, amount: request.amount, currency: request.currency, category: "Withdrawal", type: "debit", status: "completed", description: "Withdrawal approved by Crestline Capital operations", reference: request.reference, createdAt: now, updatedAt: now });
    await ctx.db.insert("ledgerEntries", { transactionId, accountId: account._id, direction: "debit", amount: request.amount, currency: request.currency, createdAt: now });
    await ctx.db.patch(account._id, { balance: account.balance - request.amount, availableBalance: account.availableBalance - request.amount, updatedAt: now });
    await ctx.db.patch(request._id, { status: "completed", reviewedBy: user._id, reviewNote: args.note.slice(0, 500), updatedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "withdrawal.approved", "withdrawal", request._id, { amount: request.amount, reference: request.reference, note: args.note.slice(0, 500) });
    await createNotification(ctx, request.userId, "transaction", "Withdrawal approved", `${request.amount.toFixed(2)} ${request.currency} has been debited from your account.`, `withdrawal-approved:${request._id}`);
    return await ctx.db.get(request._id);
  },
});

export const rejectDeposit = mutation({
  args: { requestId: v.id("depositRequests"), note: v.string() },
  handler: async (ctx, args) => {
    const { user, identity } = await requireRole(ctx, [...staffRoles]);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("INVALID_REQUEST_STATE");
    const now = Date.now();
    await ctx.db.patch(request._id, { status: "rejected", reviewedBy: user._id, reviewNote: args.note.slice(0, 500), updatedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "deposit.rejected", "deposit", request._id, { reference: request.reference, note: args.note.slice(0, 500) });
    await createNotification(ctx, request.userId, "transaction", "Deposit rejected", args.note.slice(0, 500), `deposit-rejected:${request._id}`);
    return await ctx.db.get(request._id);
  },
});

export const rejectWithdrawal = mutation({
  args: { requestId: v.id("withdrawalRequests"), note: v.string() },
  handler: async (ctx, args) => {
    const { user, identity } = await requireRole(ctx, [...staffRoles]);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("INVALID_REQUEST_STATE");
    const now = Date.now();
    await ctx.db.patch(request._id, { status: "rejected", reviewedBy: user._id, reviewNote: args.note.slice(0, 500), updatedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "withdrawal.rejected", "withdrawal", request._id, { reference: request.reference, note: args.note.slice(0, 500) });
    await createNotification(ctx, request.userId, "transaction", "Withdrawal rejected", args.note.slice(0, 500), `withdrawal-rejected:${request._id}`);
    return await ctx.db.get(request._id);
  },
});
