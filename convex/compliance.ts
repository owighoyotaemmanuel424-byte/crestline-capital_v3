import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { currentUser, requireRole, writeAudit, createNotification } from "./lib/auth";

export const startKyc = mutation({ args: {}, handler: async ctx => {
  const { user, identity } = await currentUser(ctx);
  const existing = await ctx.db.query("kycCases").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").first();
  if (existing && ["submitted", "pending", "manual_review", "verified"].includes(existing.status)) return existing;
  const now = Date.now();
  const caseId = await ctx.db.insert("kycCases", { userId: user._id, provider: "manual-review-adapter", status: "submitted", requiredFields: ["legal_name", "date_of_birth", "government_id", "proof_of_address"], createdAt: now, updatedAt: now });
  await ctx.db.patch(user._id, { kycStatus: "pending", updatedAt: now });
  await writeAudit(ctx, user._id, identity.subject, "kyc.submitted", "kycCase", caseId, { provider: "manual-review-adapter" });
  await createNotification(ctx, user._id, "compliance", "Verification submitted", "Your identity verification request is awaiting review.", `kyc-submitted:${caseId}`);
  return await ctx.db.get(caseId);
}});

export const myKyc = query({ args: {}, handler: async ctx => { const { user } = await currentUser(ctx); return await ctx.db.query("kycCases").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").first(); } });

export const queue = query({ args: { status: v.optional(v.union(v.literal("submitted"), v.literal("pending"), v.literal("manual_review"), v.literal("verified"), v.literal("rejected"), v.literal("error"))) }, handler: async ctx => {
  await requireRole(ctx, ["compliance", "admin"]);
  return args.status ? await ctx.db.query("kycCases").withIndex("by_status", q => q.eq("status", args.status!)).order("desc").collect() : await ctx.db.query("kycCases").order("desc").collect();
}});

export const review = mutation({ args: { caseId: v.id("kycCases"), decision: v.union(v.literal("verified"), v.literal("rejected"), v.literal("manual_review")), note: v.string() }, handler: async (ctx, args) => {
  const { user, identity } = await requireRole(ctx, ["compliance", "admin"]);
  const item = await ctx.db.get(args.caseId); if (!item) throw new Error("KYC_CASE_NOT_FOUND");
  if (["verified", "rejected"].includes(item.status)) throw new Error("KYC_CASE_FINAL");
  const now = Date.now(); const kycStatus = args.decision === "verified" ? "verified" : args.decision === "rejected" ? "rejected" : "manual_review";
  await ctx.db.patch(item._id, { status: args.decision, reviewerId: user._id, reviewerNote: args.note.slice(0, 2000), updatedAt: now });
  await ctx.db.patch(item.userId, { kycStatus, updatedAt: now });
  await writeAudit(ctx, user._id, identity.subject, `kyc.${args.decision}`, "kycCase", item._id, { targetUserId: item.userId, note: args.note.slice(0, 500) });
  await createNotification(ctx, item.userId, "compliance", `Verification ${args.decision}`, args.note.slice(0, 500), `kyc-review:${item._id}:${args.decision}`);
  return await ctx.db.get(item._id);
}});
