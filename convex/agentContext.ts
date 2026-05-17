import { v } from "convex/values";
import { query } from "./_generated/server";

export const dashboardContext = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12;
    const prospects = await ctx.db.query("prospects").collect();
    const drafts = await ctx.db.query("outreachDrafts").collect();
    const calls = await ctx.db.query("calls").collect();
    const activities = await ctx.db.query("activities").order("desc").take(limit);

    const hotAccounts = prospects
      .filter((prospect) => prospect.tier === "Hot" || (prospect.score ?? 0) >= 80)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 8)
      .map((prospect) => ({
        name: prospect.name,
        company: prospect.company,
        title: prospect.title,
        score: prospect.score ?? 0,
        recommendedChannel: prospect.recommendedChannel ?? "Pendiente",
        recommendedOffer: prospect.recommendedOffer ?? "Pendiente",
      }));

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalProspects: prospects.length,
        newProspects: prospects.filter((prospect) => prospect.status === "new").length,
        hot: prospects.filter((prospect) => prospect.tier === "Hot").length,
        warm: prospects.filter((prospect) => prospect.tier === "Warm").length,
        cold: prospects.filter((prospect) => prospect.tier === "Cold").length,
        pendingDrafts: drafts.filter((draft) => draft.status === "pending_approval").length,
        sentDrafts: drafts.filter((draft) => draft.status === "sent").length,
        realCalls: calls.filter((call) => call.status !== "test").length,
      },
      hotAccounts,
      recentActivities: activities.map((activity) => ({
        type: activity.type,
        channel: activity.channel,
        status: activity.status,
        notes: activity.notes,
        createdAt: activity.createdAt,
      })),
    };
  },
});
