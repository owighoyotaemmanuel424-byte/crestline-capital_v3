import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/auth";

export const recent = query({ args: { targetType: v.optional(v.string()), limit: v.optional(v.number()) }, handler: async ctx => {
  await requireRole(ctx, ["compliance", "admin"]);
  const limit = Math.min(Math.max(args.limit ?? 100, 1), 200);
  if (args.targetType) return await ctx.db.query("auditLogs").withIndex("by_target", q => q.eq("targetType", args.targetType!)).order("desc").take(limit);
  return await ctx.db.query("auditLogs").order("desc").take(limit);
}});
