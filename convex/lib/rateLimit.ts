import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function enforceRateLimit(ctx: MutationCtx, userId: Id<"users">, action: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = await ctx.db.query("rateLimits").withIndex("by_user_action", q => q.eq("userId", userId).eq("action", action)).unique();
  if (!current || now - current.windowStart >= windowMs) {
    if (current) await ctx.db.patch(current._id, { windowStart: now, count: 1 });
    else await ctx.db.insert("rateLimits", { userId, action, windowStart: now, count: 1 });
    return;
  }
  if (current.count >= limit) throw new Error("RATE_LIMITED");
  await ctx.db.patch(current._id, { count: current.count + 1 });
}
