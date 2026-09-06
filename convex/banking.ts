import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const userArg = { userId: v.id("users") };

export const dashboard = query({ args: userArg, handler: async (ctx, { userId }) => {
  const user = await ctx.db.get(userId);
  if (!user) return null;
  const accounts = await ctx.db.query("accounts").withIndex("by_user", q => q.eq("userId", userId)).collect();
  const transactions = await ctx.db.query("transactions").withIndex("by_user", q => q.eq("userId", userId)).order("desc").take(10);
  const cards = await ctx.db.query("cards").withIndex("by_user", q => q.eq("userId", userId)).collect();
  return { user, accounts, transactions, cards };
}});

export const transactions = query({ args: { userId: v.id("users"), accountId: v.optional(v.id("accounts")) }, handler: async (ctx, { userId, accountId }) => {
  if (accountId) return await ctx.db.query("transactions").withIndex("by_account", q => q.eq("accountId", accountId)).order("desc").collect();
  return await ctx.db.query("transactions").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
}});

export const transfer = mutation({ args: { userId: v.id("users"), sourceAccountId: v.id("accounts"), beneficiaryName: v.string(), beneficiaryAccount: v.string(), amount: v.number() }, handler: async (ctx, args) => {
  if (args.amount <= 0) throw new Error("Amount must be greater than zero");
  const account = await ctx.db.get(args.sourceAccountId);
  if (!account || account.userId !== args.userId) throw new Error("Source account not found");
  if (account.status !== "active") throw new Error("Account is not active");
  if (account.availableBalance < args.amount) throw new Error("Insufficient available balance");
  const now = Date.now();
  const reference = `TRF-${now}`;
  await ctx.db.patch(account._id, { balance: account.balance - args.amount, availableBalance: account.availableBalance - args.amount });
  const transactionId = await ctx.db.insert("transactions", { accountId: account._id, userId: args.userId, amount: args.amount, currency: account.currency, category: "Transfer", type: "debit", status: "completed", description: `Transfer to ${args.beneficiaryName}`, reference, createdAt: now });
  await ctx.db.insert("ledgerEntries", { transactionId, accountId: account._id, direction: "debit", amount: args.amount, currency: account.currency, createdAt: now });
  const transferId = await ctx.db.insert("transfers", { userId: args.userId, sourceAccountId: account._id, beneficiaryName: args.beneficiaryName, beneficiaryAccount: args.beneficiaryAccount, amount: args.amount, currency: account.currency, status: "completed", reference, createdAt: now });
  await ctx.db.insert("notifications", { userId: args.userId, title: "Transfer submitted", body: `A simulated transfer of ${args.amount.toFixed(2)} ${account.currency} was recorded.`, read: false, createdAt: now });
  return { transferId, reference };
}});

export const toggleCard = mutation({ args: { userId: v.id("users"), cardId: v.id("cards") }, handler: async (ctx, { userId, cardId }) => {
  const card = await ctx.db.get(cardId);
  if (!card || card.userId !== userId) throw new Error("Card not found");
  await ctx.db.patch(cardId, { isFrozen: !card.isFrozen });
  return !card.isFrozen;
}});
