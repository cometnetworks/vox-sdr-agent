import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAiClient } from "./lib/aiClient";
import type { RegisteredAction } from "convex/server";

export const answerMessage: RegisteredAction<
  "public",
  { message: string },
  Promise<string>
> = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const summary = await ctx.runQuery(api.prospects.summary);
    const { client, model, provider } = getAiClient();

    const system =
      "Eres el SDR IA de Vox Media Agency hablando por Telegram con Miguel. Responde en espanol, breve, directo y util. Puedes explicar estado, proponer siguientes pasos y aclarar que no enviaras emails ni haras llamadas sin aprobacion. Si Miguel pide scoring, investigacion, insights, hot accounts, reporte, emails o aprobaciones, dile exactamente que accion puede ejecutar el agente. No inventes resultados.";

    const user = `Mensaje de Miguel: ${args.message}

Estado real del sistema:
- Prospectos: ${summary.totalProspects}
- Nuevos sin score: ${summary.newProspects}
- Hot: ${summary.hot}
- Warm: ${summary.warm}
- Cold: ${summary.cold}
- Drafts pendientes: ${summary.pendingDrafts}
- Emails enviados: ${summary.sentDrafts}
- Llamadas reales: ${summary.realCalls}`;

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

      return response.choices[0]?.message?.content || "Estoy conectado, pero no pude generar respuesta.";
    }

    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return response.output_text;
  },
});
