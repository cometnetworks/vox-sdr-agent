import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prospects: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.string(),
    title: v.string(),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    status: v.string(),
    tier: v.optional(v.string()),
    score: v.optional(v.number()),
    recommendedChannel: v.optional(v.string()),
    recommendedOffer: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  accountResearch: defineTable({
    prospectId: v.id("prospects"),
    companySummary: v.string(),
    marketContext: v.string(),
    buyingSignals: v.array(v.string()),
    sourceUrls: v.array(v.string()),
    confidence: v.number(),
    createdAt: v.number(),
  }).index("by_prospect", ["prospectId"]),

  triggers: defineTable({
    prospectId: v.id("prospects"),
    triggerType: v.string(),
    triggerDescription: v.string(),
    intensity: v.string(),
    opportunityHypothesis: v.string(),
    createdAt: v.number(),
  }).index("by_prospect", ["prospectId"]),

  insights: defineTable({
    prospectId: v.id("prospects"),
    painPoint: v.string(),
    voxAngle: v.string(),
    offerRecommendation: v.string(),
    commercialNarrative: v.string(),
    createdAt: v.number(),
  }).index("by_prospect", ["prospectId"]),

  outreachDrafts: defineTable({
    prospectId: v.id("prospects"),
    channel: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    toneVersion: v.string(),
    status: v.string(),
    approvedBy: v.optional(v.string()),
    resendEmailId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  activities: defineTable({
    prospectId: v.optional(v.id("prospects")),
    type: v.string(),
    channel: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_prospect", ["prospectId"]),

  dailyReports: defineTable({
    date: v.string(),
    executiveSummary: v.string(),
    marketSignals: v.array(v.string()),
    priorityAccounts: v.array(v.any()),
    readyMessages: v.array(v.any()),
    executiveBriefs: v.array(v.any()),
    nextSteps: v.array(v.string()),
    telegramMessageId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  calls: defineTable({
    prospectId: v.id("prospects"),
    provider: v.string(),
    providerCallId: v.optional(v.string()),
    status: v.string(),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    result: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_prospect", ["prospectId"]),
});

