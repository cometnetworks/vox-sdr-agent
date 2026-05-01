import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prospects").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.string(),
    title: v.string(),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("prospects", {
      ...args,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateScore = mutation({
  args: {
    prospectId: v.id("prospects"),
    score: v.number(),
    tier: v.string(),
    recommendedChannel: v.string(),
    recommendedOffer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.prospectId, {
      score: args.score,
      tier: args.tier,
      recommendedChannel: args.recommendedChannel,
      recommendedOffer: args.recommendedOffer,
      status: "scored",
      updatedAt: Date.now(),
    });
  },
});

export const createActivity = mutation({
  args: {
    prospectId: v.optional(v.id("prospects")),
    type: v.string(),
    channel: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

