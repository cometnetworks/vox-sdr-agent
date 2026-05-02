import { v } from "convex/values";
import { action } from "./_generated/server";
import { generateStrategyForProspect } from "./lib/aiClient";

export const generateProspectStrategy = action({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.string(),
    title: v.string(),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  },
  handler: async (_ctx, prospect) => {
    return await generateStrategyForProspect(prospect);
  },
});

