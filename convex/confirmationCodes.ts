import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, writeAudit, createNotification } from "./lib/auth";

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

export const customers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["operator", "admin"]);
    return await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "customer")).order("desc").take(100);
  },
});

export const activeForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await import("./lib/auth").then(m => m.currentUser(ctx));
    const now = Date.now();
    return (await ctx.db.query("confirmationCodes").withIndex("by_user_status", q => q.eq("userId", user._id).eq("status", "active")).order("desc").take(20)).filter(c => c.expiresAt > now);
  },
});

export const issue = mutation({
  args: { userId: v.id("users"), expiresInMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { user, identity } = await requireRole(ctx, ["operator", "admin"]);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role !== "customer") throw new Error("CUSTOMER_REQUIRED");
    const existing = await ctx.db.query("confirmationCodes").withIndex("by_user_status", q => q.eq("userId", target._id).eq("status", "active")).collect();
    const now = Date.now();
    for (const code of existing) {
      if (code.expiresAt > now) await ctx.db.patch(code._id, { status: "revoked", revokedAt: now });
    }
    const minutes = Math.min(Math.max(Math.floor(args.expiresInMinutes ?? 30), 5), 1440);
    let code = generateCode();
    while (await ctx.db.query("confirmationCodes").withIndex("by_code", q => q.eq("code", code)).first()) code = generateCode();
    const codeId = await ctx.db.insert("confirmationCodes", { userId: target._id, code, status: "active", purpose: "transfer_authorization", createdBy: user._id, createdAt: now, expiresAt: now + minutes * 60_000 });
    await createNotification(ctx, target._id, "security", "Transfer authorization code issued", `Your Crestline Capital transfer authorization code is ${code}. It expires in ${minutes} minutes.`, `authorization-code:${codeId}`);
    await writeAudit(ctx, user._id, identity.subject, "confirmation_code.issued", "confirmation_code", codeId, { targetUserId: target._id, expiresAt: now + minutes * 60_000 });
    return { id: codeId, code, expiresAt: now + minutes * 60_000, userId: target._id };
  },
});

export const revoke = mutation({
  args: { codeId: v.id("confirmationCodes") },
  handler: async (ctx, args) => {
    const { user, identity } = await requireRole(ctx, ["operator", "admin"]);
    const code = await ctx.db.get(args.codeId);
    if (!code) throw new Error("CODE_NOT_FOUND");
    if (code.status !== "active") throw new Error("CODE_NOT_ACTIVE");
    const now = Date.now();
    await ctx.db.patch(code._id, { status: "revoked", revokedAt: now });
    await writeAudit(ctx, user._id, identity.subject, "confirmation_code.revoked", "confirmation_code", code._id, { targetUserId: code.userId });
    return true;
  },
});