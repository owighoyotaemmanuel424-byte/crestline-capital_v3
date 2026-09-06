import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, writeAudit } from "./lib/auth";

export const rules = query({ args: {}, handler: async ctx => { await requireRole(ctx,["compliance","admin"]); return await ctx.db.query("fraudRules").withIndex("by_enabled", q => q.eq("enabled", true)).collect(); } });

export const upsertRule = mutation({ args: { name: v.string(), threshold: v.number(), action: v.union(v.literal("allow"),v.literal("review"),v.literal("deny")), description: v.string(), enabled: v.boolean() }, handler: async (ctx,args) => { const { user, identity } = await requireRole(ctx,["admin"]); if(!Number.isFinite(args.threshold)||args.threshold<0||args.threshold>100) throw new Error("INVALID_THRESHOLD"); const existing=await ctx.db.query("fraudRules").collect(); const match=existing.find(r=>r.name===args.name); const data={name:args.name.trim().slice(0,100),threshold:args.threshold,action:args.action,description:args.description.slice(0,500),enabled:args.enabled,updatedAt:Date.now(),updatedBy:user._id}; const id=match?(await ctx.db.patch(match._id,data),match._id):await ctx.db.insert("fraudRules",data); await writeAudit(ctx,user._id,identity.subject,"fraud.rule_changed","fraudRule",id,{name:data.name,threshold:data.threshold,action:data.action,enabled:data.enabled}); return await ctx.db.get(id); } });
