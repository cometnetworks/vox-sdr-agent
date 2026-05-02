import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { extractJsonObject, generateStrategyForProspect } from "./lib/aiClient";
import type { RegisteredAction } from "convex/server";

type ScoringResult = {
  processed: number;
  results: Array<{
    company: string;
    name: string;
    score: number;
    tier: string;
    offer: string;
  }>;
};

export const scoreNewProspects: RegisteredAction<
  "public",
  { limit?: number },
  Promise<ScoringResult>
> = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const prospects = await ctx.runQuery(api.prospects.listNew, {
      limit: args.limit ?? 10,
    });

    const results = [];

    for (const prospect of prospects) {
      const rawStrategy = await generateStrategyForProspect({
        name: prospect.name,
        email: prospect.email,
        company: prospect.company,
        title: prospect.title,
        phone: prospect.phone,
        linkedin: prospect.linkedin,
      });

      const strategy = extractJsonObject(rawStrategy);

      await ctx.runMutation(api.prospects.saveStrategy, {
        prospectId: prospect._id,
        score: Number(strategy.score || 0),
        tier: String(strategy.tier || "Cold"),
        trigger: String(strategy.trigger || "Sin trigger claro"),
        painPoint: String(strategy.painPoint || "Pendiente"),
        voxAngle: String(strategy.voxAngle || "Pendiente"),
        recommendedOffer: String(strategy.recommendedOffer || "Reuniones"),
        recommendedChannel: String(strategy.recommendedChannel || "Email"),
        emailSubject: String(strategy.emailSubject || `Oportunidad comercial para ${prospect.company}`),
        emailBody: String(strategy.emailBody || ""),
        brief: String(strategy.brief || ""),
        nextStep: String(strategy.nextStep || "Revisar manualmente"),
      });

      results.push({
        company: prospect.company,
        name: prospect.name,
        score: Number(strategy.score || 0),
        tier: String(strategy.tier || "Cold"),
        offer: String(strategy.recommendedOffer || "Reuniones"),
      });
    }

    return {
      processed: results.length,
      results,
    };
  },
});
