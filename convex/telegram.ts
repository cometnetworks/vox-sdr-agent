import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAiClient } from "./lib/aiClient";
import type { RegisteredAction } from "convex/server";

function getDeterministicReply(message: string) {
  const normalized = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (
    normalized.includes("como te llamas") ||
    normalized.includes("cual es tu nombre") ||
    normalized.includes("quien eres") ||
    normalized === "tu nombre" ||
    normalized === "nombre"
  ) {
    return "Soy Javier Reus, el ejecutivo SDR IA de Vox. En Telegram el bot puede aparecer como Kodyx para identificar el canal, pero mi identidad comercial es Javier.";
  }

  return null;
}

function buildFallbackReply(args: {
  message: string;
  totalProspects: number;
  hot: number;
  pendingDrafts: number;
  realCalls: number;
}) {
  return [
    "Miguel, soy Javier.",
    "",
    "Estoy conectado, pero el modelo no genero una respuesta util en este intento.",
    `Estado rapido: ${args.totalProspects} prospectos, ${args.hot} Hot, ${args.pendingDrafts} drafts pendientes y ${args.realCalls} llamadas reales.`,
    "",
    "Si quieres, dime una accion concreta: revisar Hot, registrar contacto, preparar draft o correr scoring.",
  ].join("\n");
}

export const answerMessage: RegisteredAction<
  "public",
  { message: string },
  Promise<string>
> = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const deterministicReply = getDeterministicReply(args.message);

    if (deterministicReply) {
      return deterministicReply;
    }

    const summary = await ctx.runQuery(api.prospects.summary);
    const context = await ctx.runQuery(api.agentContext.dashboardContext, { limit: 10 });
    const { client, model, provider } = getAiClient();

    const system =
      "Eres Javier Reus, el ejecutivo SDR IA de Vox Media Agency, hablando por Telegram con Miguel Cedillo. Responde en espanol, breve, directo y con criterio comercial. No suenes como bot ni como soporte tecnico. Puedes explicar estado, proponer siguientes pasos y aclarar que no enviaras emails ni haras llamadas sin aprobacion. Si Miguel pregunta por algo hablado en Telegram, usa la actividad reciente. Si no esta en contexto, dilo claro. Si Miguel pide scoring, investigacion, insights, hot accounts, reporte, emails o aprobaciones, dile exactamente que accion puede ejecutar el agente. No inventes resultados.";

    const recentActivities = context.recentActivities
      .map(
        (activity) =>
          `- ${activity.channel ?? "sistema"} | ${activity.type} | ${activity.status}: ${activity.notes ?? "sin notas"}`,
      )
      .join("\n");

    const hotAccounts = context.hotAccounts
      .map(
        (account, index) =>
          `${index + 1}. ${account.company} - ${account.name}, score ${account.score}, oferta ${account.recommendedOffer}, canal ${account.recommendedChannel}`,
      )
      .join("\n");

    const user = `Mensaje de Miguel: ${args.message}

Estado real del sistema:
- Prospectos: ${summary.totalProspects}
- Nuevos sin score: ${summary.newProspects}
- Hot: ${summary.hot}
- Warm: ${summary.warm}
- Cold: ${summary.cold}
- Drafts pendientes: ${summary.pendingDrafts}
- Emails enviados: ${summary.sentDrafts}
- Llamadas reales: ${summary.realCalls}

Cuentas Hot actuales:
${hotAccounts || "No hay cuentas Hot registradas."}

Actividad reciente compartida:
${recentActivities || "Sin actividad reciente registrada."}`;

    try {
      if (provider === "openrouter") {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: 260,
          temperature: 0.4,
        });

        return (
          response.choices[0]?.message?.content ||
          buildFallbackReply({
            message: args.message,
            totalProspects: summary.totalProspects,
            hot: summary.hot,
            pendingDrafts: summary.pendingDrafts,
            realCalls: summary.realCalls,
          })
        );
      }

      const response = await client.responses.create({
        model,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      return (
        response.output_text ||
        buildFallbackReply({
          message: args.message,
          totalProspects: summary.totalProspects,
          hot: summary.hot,
          pendingDrafts: summary.pendingDrafts,
          realCalls: summary.realCalls,
        })
      );
    } catch (error) {
      console.error("Telegram AI response failed", error);

      return buildFallbackReply({
        message: args.message,
        totalProspects: summary.totalProspects,
        hot: summary.hot,
        pendingDrafts: summary.pendingDrafts,
        realCalls: summary.realCalls,
      });
    }
  },
});
