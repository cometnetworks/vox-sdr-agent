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

async function buildTelegramReply(ctx: Parameters<Parameters<typeof httpAction>[0]>[0], update: TelegramUpdate) {
  const command = getTelegramCommand(update);
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
    const hotProspects = await ctx.runQuery(api.prospects.hot);

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

  if (command === "ayuda" || command === "help") {
    return [
      "Comandos:",
      "/start - iniciar bot",
      "/reporte - resumen del dia",
      "/hot - cuentas prioritarias",
      "/ayuda - comandos disponibles",
    ].join("\n");
  }

  return [
    "Recibi tu mensaje.",
    "",
    "Por ahora estoy en modo setup. Usa /reporte, /hot o /ayuda.",
  ].join("\n");
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
