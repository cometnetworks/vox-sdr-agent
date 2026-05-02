import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

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

function buildTelegramReply(update: TelegramUpdate) {
  const text = update.message?.text?.trim().toLowerCase() || "";
  const firstName = update.message?.from?.first_name || "Miguel";

  if (text === "/start") {
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

  if (text === "/reporte") {
    return [
      "Reporte SDR IA",
      "",
      "Estado: conectado",
      "Prospectos base: pendiente de importar CSV",
      "Emails enviados: 0",
      "Llamadas reales: 0",
      "",
      "Siguiente paso: importar los 10 prospectos y generar drafts para aprobacion.",
    ].join("\n");
  }

  if (text === "/hot") {
    return [
      "Cuentas Hot",
      "",
      "Todavia no hay cuentas Hot reales porque falta importar la base inicial.",
      "Cuando importemos el CSV, aqui veras empresa, contacto, score y accion recomendada.",
    ].join("\n");
  }

  if (text === "/ayuda" || text === "ayuda") {
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
  handler: httpAction(async (_ctx, request) => {
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

    await sendTelegramMessage(chatId, buildTelegramReply(update));

    return new Response(JSON.stringify({ ok: true, received: Boolean(update) }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;
