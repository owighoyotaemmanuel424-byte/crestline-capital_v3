import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(), name: v.string(), passwordHash: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin"), v.literal("compliance")),
    kycStatus: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected")),
    twoFactorEnabled: v.boolean(), createdAt: v.number(),
  }).index("by_email", ["email"]),
  accounts: defineTable({
    userId: v.id("users"), type: v.union(v.literal("checking"), v.literal("savings"), v.literal("business")),
    balance: v.number(), availableBalance: v.number(), currency: v.string(), accountNumberMasked: v.string(),
    status: v.union(v.literal("active"), v.literal("frozen")), createdAt: v.number(),
  }).index("by_user", ["userId"]),
  transactions: defineTable({
    accountId: v.id("accounts"), userId: v.id("users"), amount: v.number(), currency: v.string(),
    category: v.string(), type: v.union(v.literal("debit"), v.literal("credit")),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    description: v.string(), reference: v.string(), createdAt: v.number(),
  }).index("by_account", ["accountId", "createdAt"]).index("by_user", ["userId", "createdAt"]),
  ledgerEntries: defineTable({
    transactionId: v.id("transactions"), accountId: v.id("accounts"), direction: v.union(v.literal("debit"), v.literal("credit")),
    amount: v.number(), currency: v.string(), createdAt: v.number(),
  }).index("by_transaction", ["transactionId"]),
  cards: defineTable({
    accountId: v.id("accounts"), userId: v.id("users"), last4: v.string(), brand: v.string(),
    isFrozen: v.boolean(), expiryMonth: v.number(), expiryYear: v.number(), createdAt: v.number(),
  }).index("by_user", ["userId"]),
  transfers: defineTable({
    userId: v.id("users"), sourceAccountId: v.id("accounts"), beneficiaryName: v.string(), beneficiaryAccount: v.string(),
    amount: v.number(), currency: v.string(), status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    reference: v.string(), createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),
  notifications: defineTable({ userId: v.id("users"), title: v.string(), body: v.string(), read: v.boolean(), createdAt: v.number() }).index("by_user", ["userId", "createdAt"]),
});
