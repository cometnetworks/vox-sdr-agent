import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

type TelegramUpdate = {
  message?: {
    chat: {
      id: number;
    };
    text?: string;
    from?: {
      first_name?: string;
    };
  };
};

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}

function isAllowedChat(chatId: number) {
  const allowedChatId = process.env.TELEGRAM_ALLOWED_CHAT_ID;

  if (!allowedChatId) {
    return true;
  }

  return String(chatId) === allowedChatId;
}

function getTelegramCommand(update: TelegramUpdate) {
  const rawText = update.message?.text?.trim().toLowerCase() || "";
  const firstToken = rawText.split(/\s+/)[0] || "";
  const withoutBotSuffix = firstToken.split("@")[0];

  if (withoutBotSuffix.startsWith("/")) {
    return withoutBotSuffix.slice(1);
  }

  return withoutBotSuffix;
}

function getTelegramText(update: TelegramUpdate) {
  return update.message?.text?.trim() || "";
}

function wantsScoring(text: string, command: string) {
  const normalized = text.toLowerCase();

  return (
    command === "scoring" ||
    command === "score" ||
    command === "analiza" ||
    normalized.includes("scoring") ||
    normalized.includes("score") ||
    normalized.includes("insight") ||
    normalized.includes("prioriza") ||
    normalized.includes("priorizar") ||
    normalized.includes("analiza los prospectos") ||
    normalized.includes("analizar los prospectos")
  );
}

async function buildTelegramReply(ctx: Parameters<Parameters<typeof httpAction>[0]>[0], update: TelegramUpdate) {
  const command = getTelegramCommand(update);
  const text = getTelegramText(update);
  const firstName = update.message?.from?.first_name || "Miguel";

  if (command === "start") {
    return [
      `Hola ${firstName}. Soy el SDR IA de Vox Media Agency.`,
      "",
      "Estoy conectado a Convex y listo para operar en modo controlado.",
      "",
      "Comandos disponibles:",
      "/reporte - ver resumen del dia",
      "/hot - ver cuentas prioritarias",
      "/scoring - correr scoring e insights",
      "/ayuda - ver comandos",
      "",
      "Regla activa: no envio emails ni hago llamadas reales sin aprobacion.",
    ].join("\n");
  }

  if (command === "reporte") {
    const summary = await ctx.runQuery(api.prospects.summary);

    return [
      "Reporte SDR IA",
      "",
      "Estado: conectado",
      `Prospectos base: ${summary.totalProspects}`,
      `Nuevos sin score: ${summary.newProspects}`,
      `Hot: ${summary.hot}`,
      `Warm: ${summary.warm}`,
      `Cold: ${summary.cold}`,
      `Drafts pendientes: ${summary.pendingDrafts}`,
      `Emails enviados: ${summary.sentDrafts}`,
      `Llamadas reales: ${summary.realCalls}`,
      "",
      "Siguiente paso: ejecutar scoring e insights para priorizar cuentas.",
    ].join("\n");
  }

  if (command === "hot") {
    const hotProspects: Array<{
      name: string;
      company: string;
      title: string;
      score: number;
      recommendedOffer: string;
      recommendedChannel: string;
    }> = await ctx.runQuery(api.prospects.hot);

    if (hotProspects.length === 0) {
      return [
        "Cuentas Hot",
        "",
        "Todavia no hay cuentas Hot porque los prospectos importados aun no tienen scoring.",
        "Siguiente paso: ejecutar Research + Scoring Agent sobre la base inicial.",
      ].join("\n");
    }

    return [
      "Cuentas Hot",
      "",
      ...hotProspects.map(
        (prospect, index) =>
          `${index + 1}. ${prospect.company} - ${prospect.name}\nScore: ${prospect.score}\nOferta: ${prospect.recommendedOffer}\nCanal: ${prospect.recommendedChannel}`,
      ),
    ].join("\n");
  }

  if (wantsScoring(text, command)) {
    let result: {
      processed: number;
      results: Array<{
        company: string;
        name: string;
        score: number;
        tier: string;
        offer: string;
      }>;
    };

    try {
      result = await ctx.runAction(api.scoring.scoreNewProspects, { limit: 10 });
    } catch (error) {
      const summary = await ctx.runQuery(api.prospects.summary);
      const message = error instanceof Error ? error.message : String(error);
      const isCreditIssue =
        message.includes("402") ||
        message.toLowerCase().includes("insufficient credits") ||
        message.toLowerCase().includes("requires more credits");

      return [
        "Scoring detenido",
        "",
        `Progreso guardado: ${summary.hot + summary.warm + summary.cold} de ${summary.totalProspects} prospectos con score.`,
        `Pendientes sin score: ${summary.newProspects}`,
        `Drafts pendientes: ${summary.pendingDrafts}`,
        "",
        isCreditIssue
          ? "Motivo: OpenRouter no tiene creditos suficientes para continuar."
          : "Motivo: hubo un error procesando una respuesta del modelo.",
        "",
        "No se perdio lo procesado. Cuando agreguemos creditos o cambiemos a OpenAI, puedo continuar solo con los pendientes.",
      ].join("\n");
    }

    if (result.processed === 0) {
      return [
        "Scoring e insights",
        "",
        "No encontre prospectos nuevos pendientes de scoring.",
        "Puedes revisar /reporte o /hot para ver el estado actual.",
      ].join("\n");
    }

    return [
      "Scoring e insights completados",
      "",
      `Prospectos procesados: ${result.processed}`,
      "",
      ...result.results
        .slice(0, 5)
        .map(
          (item, index) =>
            `${index + 1}. ${item.company} - ${item.name}\nScore: ${item.score}\nTier: ${item.tier}\nOferta: ${item.offer}`,
        ),
      "",
      "Ya genere drafts en cola de aprobacion. Usa /reporte o /hot para revisar el estado.",
    ].join("\n");
  }

  if (command === "ayuda" || command === "help") {
    return [
      "Comandos:",
      "/start - iniciar bot",
      "/reporte - resumen del dia",
      "/hot - cuentas prioritarias",
      "/scoring - correr scoring e insights",
      "/ayuda - comandos disponibles",
      "",
      "Tambien puedes hablarme normal. Ejemplo: realiza el scoring e insight de los prospectos.",
    ].join("\n");
  }

  return await ctx.runAction(api.telegram.answerMessage, { message: text });
}

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ ok: true, service: "vox-sdr-agent" }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

http.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat.id;

    if (!chatId) {
      return new Response(JSON.stringify({ ok: true, ignored: "no_chat" }), {
        headers: { "content-type": "application/json" },
      });
    }

    if (!isAllowedChat(chatId)) {
      return new Response(JSON.stringify({ ok: true, ignored: "unauthorized_chat" }), {
        headers: { "content-type": "application/json" },
      });
    }

    await sendTelegramMessage(chatId, await buildTelegramReply(ctx, update));

    return new Response(JSON.stringify({ ok: true, received: Boolean(update) }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;
