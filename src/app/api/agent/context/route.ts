import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CONVEX_URL server environment variable." },
      { status: 500 },
    );
  }

  const client = new ConvexHttpClient(convexUrl);
  const context = await client.query(api.agentContext.dashboardContext, { limit: 12 });

  return NextResponse.json({
    context,
    text: buildAgentContextText(context),
  });
}

type AgentContext = {
  generatedAt: string;
  summary: {
    totalProspects: number;
    newProspects: number;
    hot: number;
    warm: number;
    cold: number;
    pendingDrafts: number;
    sentDrafts: number;
    realCalls: number;
  };
  hotAccounts: Array<{
    name: string;
    company: string;
    title: string;
    score: number;
    recommendedChannel: string;
    recommendedOffer: string;
  }>;
  recentActivities: Array<{
    type: string;
    channel?: string;
    status: string;
    notes?: string;
    createdAt: number;
  }>;
};

function buildAgentContextText(context: AgentContext) {
  const hotAccounts = context.hotAccounts
    .map(
      (account, index) =>
        `${index + 1}. ${account.company} - ${account.name}, ${account.title}. Score ${account.score}. Oferta ${account.recommendedOffer}. Canal ${account.recommendedChannel}.`,
    )
    .join("\n");

  const recentActivities = context.recentActivities
    .map((activity) => {
      const date = new Date(activity.createdAt).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Merida",
      });

      return `- ${date} | ${activity.channel ?? "sistema"} | ${activity.type} | ${activity.status}: ${activity.notes ?? "sin notas"}`;
    })
    .join("\n");

  return [
    "Contexto operativo actual de Vox SDR IA.",
    "",
    `Fecha de contexto: ${context.generatedAt}`,
    "",
    "Estado comercial:",
    `- Prospectos totales: ${context.summary.totalProspects}`,
    `- Nuevos sin score: ${context.summary.newProspects}`,
    `- Hot: ${context.summary.hot}`,
    `- Warm: ${context.summary.warm}`,
    `- Cold: ${context.summary.cold}`,
    `- Drafts pendientes: ${context.summary.pendingDrafts}`,
    `- Emails enviados: ${context.summary.sentDrafts}`,
    `- Llamadas reales: ${context.summary.realCalls}`,
    "",
    "Cuentas Hot actuales:",
    hotAccounts || "No hay cuentas Hot registradas.",
    "",
    "Actividad reciente compartida entre Telegram, dashboard y sistema:",
    recentActivities || "Sin actividad reciente registrada.",
    "",
    "Regla critica: no digas que enviaste correos ni que hiciste llamadas reales si no aparece en este contexto o no fue aprobado por Miguel.",
  ].join("\n");
}
