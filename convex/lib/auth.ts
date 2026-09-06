import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  return identity;
}

export async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db.query("users").withIndex("by_auth_subject", q => q.eq("authSubject", identity.subject)).unique();
  if (!user) throw new Error("USER_NOT_PROVISIONED");
  if (user.accountStatus === "closed") throw new Error("ACCOUNT_CLOSED");
  return { user, identity };
}

export async function requireRole(ctx: QueryCtx | MutationCtx, roles: Array<"customer" | "support" | "operator" | "compliance" | "admin">) {
  const result = await currentUser(ctx);
  if (!roles.includes(result.user.role)) throw new Error("FORBIDDEN");
  return result;
}

export async function writeAudit(ctx: MutationCtx, actorUserId: Id<"users"> | undefined, actorSubject: string, action: string, targetType: string, targetId: string | undefined, metadata: unknown) {
  await ctx.db.insert("auditLogs", { actorUserId, actorSubject, action, targetType, targetId, metadata, createdAt: Date.now() });
}

export async function createNotification(ctx: MutationCtx, userId: Id<"users">, type: "transaction" | "security" | "account" | "compliance", title: string, body: string, dedupeKey: string) {
  const existing = await ctx.db.query("notifications").withIndex("by_dedupe", q => q.eq("userId", userId).eq("dedupeKey", dedupeKey)).unique();
  if (existing) return existing._id;
  const notificationId = await ctx.db.insert("notifications", { userId, type, title, body, dedupeKey, read: false, createdAt: Date.now() });
  await ctx.db.insert("notificationDeliveries", { notificationId, channel: "in_app", status: "sent", provider: "convex-in-app", attempts: 1, updatedAt: Date.now() });
  return notificationId;
}
