import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, writeAudit, createNotification } from "./lib/auth";

const staff = ["support", "operator", "compliance", "admin"] as const;

export const overview = query({ args: {}, handler: async ctx => {
  await requireRole(ctx, [...staff]);
  const pendingKyc = await ctx.db.query("kycCases").withIndex("by_status", q => q.eq("status", "manual_review")).take(50);
  const reviewTransfers = await ctx.db.query("transfers").withIndex("by_status", q => q.eq("status", "review")).take(50);
  const failedTransfers = await ctx.db.query("transfers").withIndex("by_status", q => q.eq("status", "failed")).take(50);
  return { pendingKyc, reviewTransfers, failedTransfers };
}});

export const account = query({ args: { accountId: v.id("accounts") }, handler: async (ctx, { accountId }) => {
  await requireRole(ctx, [...staff]);
  const account = await ctx.db.get(accountId); if (!account) throw new Error("ACCOUNT_NOT_FOUND");
  const user = await ctx.db.get(account.userId);
  const transactions = await ctx.db.query("transactions").withIndex("by_account", q => q.eq("accountId", accountId)).order("desc").take(100);
  return { account, user: user ? { _id: user._id, name: user.name, email: user.email, role: user.role, kycStatus: user.kycStatus, accountStatus: user.accountStatus } : null, transactions };
}});

export const transferQueue = query({ args: { status: v.optional(v.union(v.literal("review"), v.literal("processing"), v.literal("failed"), v.literal("completed"))) }, handler: async ctx => {
  await requireRole(ctx, [...staff]);
  return args.status ? await ctx.db.query("transfers").withIndex("by_status", q => q.eq("status", args.status!)).order("desc").take(100) : await ctx.db.query("transfers").order("desc").take(100);
}});

export const resolveTransfer = mutation({ args: { transferId: v.id("transfers"), decision: v.union(v.literal("complete"), v.literal("fail")), note: v.string() }, handler: async (ctx, args) => {
  const { user, identity } = await requireRole(ctx, ["operator", "admin"]);
  const transfer = await ctx.db.get(args.transferId); if (!transfer) throw new Error("TRANSFER_NOT_FOUND");
  if (!["review", "processing"].includes(transfer.status)) throw new Error("INVALID_TRANSFER_STATE");
  if (args.decision === "complete") {
    if (transfer.status === "processing") throw new Error("PROCESSING_REQUIRES_PROVIDER_CONFIRMATION");
    throw new Error("EXTERNAL_SETTLEMENT_UNAVAILABLE");
  }
  const now = Date.now();
  await ctx.db.patch(transfer._id, { status: "failed", failureCode: "MANUAL_REJECT", failureMessage: args.note.slice(0, 500), updatedAt: now });
  await writeAudit(ctx, user._id, identity.subject, "transfer.manually_failed", "transfer", transfer._id, { note: args.note.slice(0, 500) });
  await createNotification(ctx, transfer.userId, "transaction", "Transfer failed", args.note.slice(0, 500), `transfer-failed:${transfer._id}`);
  return await ctx.db.get(transfer._id);
}});

export const setAccountStatus = mutation({ args: { accountId: v.id("accounts"), status: v.union(v.literal("active"), v.literal("frozen"), v.literal("closed")), reason: v.string() }, handler: async (ctx, args) => {
  const { user, identity } = await requireRole(ctx, ["operator", "admin"]);
  const account = await ctx.db.get(args.accountId); if (!account) throw new Error("ACCOUNT_NOT_FOUND");
  if (account.status === "closed" && args.status !== "closed") throw new Error("CLOSED_ACCOUNT_IMMUTABLE");
  await ctx.db.patch(account._id, { status: args.status, updatedAt: Date.now() });
  await writeAudit(ctx, user._id, identity.subject, "account.status_changed", "account", account._id, { status: args.status, reason: args.reason.slice(0, 500) });
  await createNotification(ctx, account.userId, "account", `Account ${args.status}`, args.reason.slice(0, 500), `account-status:${account._id}:${args.status}`);
  return await ctx.db.get(account._id);
}});

export const setUserRole = mutation({ args: { userId: v.id("users"), role: v.union(v.literal("customer"), v.literal("support"), v.literal("operator"), v.literal("compliance"), v.literal("admin")) }, handler: async (ctx, args) => {
  const { user, identity } = await requireRole(ctx, ["admin"]);
  if (args.userId === user._id) throw new Error("SELF_ROLE_CHANGE_NOT_ALLOWED");
  const target = await ctx.db.get(args.userId); if (!target) throw new Error("USER_NOT_FOUND");
  await ctx.db.patch(target._id, { role: args.role, updatedAt: Date.now() });
  await writeAudit(ctx, user._id, identity.subject, "user.role_changed", "user", target._id, { role: args.role });
  return await ctx.db.get(target._id);
}});
