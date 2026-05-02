import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prospects").order("desc").collect();
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const prospects = await ctx.db.query("prospects").collect();
    const drafts = await ctx.db.query("outreachDrafts").collect();
    const calls = await ctx.db.query("calls").collect();

    const hot = prospects.filter((prospect) => prospect.tier === "Hot").length;
    const warm = prospects.filter((prospect) => prospect.tier === "Warm").length;
    const cold = prospects.filter((prospect) => prospect.tier === "Cold").length;
    const pendingDrafts = drafts.filter((draft) => draft.status === "pending_approval").length;
    const sentDrafts = drafts.filter((draft) => draft.status === "sent").length;
    const realCalls = calls.filter((call) => call.status !== "test").length;

    return {
      totalProspects: prospects.length,
      hot,
      warm,
      cold,
      newProspects: prospects.filter((prospect) => prospect.status === "new").length,
      pendingDrafts,
      sentDrafts,
      realCalls,
    };
  },
});

export const hot = query({
  args: {},
  handler: async (ctx) => {
    const prospects = await ctx.db.query("prospects").collect();

    return prospects
      .filter((prospect) => prospect.tier === "Hot" || (prospect.score ?? 0) >= 80)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10)
      .map((prospect) => ({
        name: prospect.name,
        company: prospect.company,
        title: prospect.title,
        score: prospect.score ?? 0,
        recommendedOffer: prospect.recommendedOffer ?? "Pendiente",
        recommendedChannel: prospect.recommendedChannel ?? "Pendiente",
      }));
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

export const importBatch = mutation({
  args: {
    prospects: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        company: v.string(),
        title: v.string(),
        phone: v.optional(v.string()),
        linkedin: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const prospect of args.prospects) {
      const email = prospect.email.trim().toLowerCase();
      const existing = await ctx.db
        .query("prospects")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...prospect,
          email,
          updatedAt: now,
        });
        updated += 1;
      } else {
        await ctx.db.insert("prospects", {
          ...prospect,
          email,
          status: "new",
          createdAt: now,
          updatedAt: now,
        });
        inserted += 1;
      }
    }

    return { inserted, updated, total: args.prospects.length };
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
