import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { currentUser } from "./lib/auth";

export const listMine = query({ args: {}, handler: async ctx => { const { user } = await currentUser(ctx); return await ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(50); } });
export const markRead = mutation({ args: { notificationId: v.id("notifications") }, handler: async ctx => { const { user } = await currentUser(ctx); const item = await ctx.db.get(notificationId); if (!item || item.userId !== user._id) throw new Error("FORBIDDEN"); await ctx.db.patch(item._id, { read: true }); return true; } });
export const markAllRead = mutation({ args: {}, handler: async ctx => { const { user } = await currentUser(ctx); const items = await ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", user._id)).collect(); for (const item of items) if (!item.read) await ctx.db.patch(item._id, { read: true }); return items.length; } });
