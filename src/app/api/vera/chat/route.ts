import OpenAI from "openai";
import type { Stream } from "openai/core/streaming";
import type {
  ChatCompletionChunk,
  ChatCompletionCreateParamsStreaming,
} from "openai/resources/chat/completions";
import { NextResponse } from "next/server";

import { getBrainConfig, type BrainConfig } from "@/lib/jarvis/keys";
import { buildSystemPrompt } from "@/lib/jarvis/persona";
import { createSpokenFilter } from "@/lib/jarvis/spokenFilter";

export const dynamic = "force-dynamic";

const MAX_TURNS = 12;
const MAX_TURN_LENGTH = 1200;

type ChatTurn = { role: "user" | "assistant"; content: string };

/** Avisa al HUD si Vera puede pensar con IA o si sigue con reglas fijas. */
export async function GET() {
  const config = await getBrainConfig();
  return NextResponse.json({
    available: Boolean(config.apiKey),
    provider: config.label,
    model: config.model,
  });
}

/**
 * Responde en streaming de texto plano: el HUD va mostrando y diciendo cada
 * frase en cuanto llega, en vez de esperar la respuesta completa.
 */
export async function POST(request: Request) {
  const config = await getBrainConfig();

  if (!config.apiKey) {
    return NextResponse.json(
      {
        error:
          "Vera no tiene cerebro de IA todavía. Pega tu llave de FreeLLMAPI en llaves/freellmapi.txt o la de OpenRouter en llaves/openrouter.txt, y recarga la página. Mientras, respondo con frases fijas.",
      },
      { status: 501 },
    );
  }

  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const history = sanitizeHistory(body?.messages);

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Falta el mensaje para Vera." }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    maxRetries: 0,
    timeout: 25_000,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Vox SDR IA Agent",
    },
  });

  const params = {
    model: config.model,
    stream: true,
    // Holgado: si el modelo razona dentro de la respuesta, que no corte lo que dice.
    max_tokens: 900,
    temperature: 0.6,
    messages: [{ role: "system", content: buildSystemPrompt() }, ...history],
    // Solo OpenRouter entiende `reasoning`; otros proveedores rechazan campos extra.
    ...(config.provider === "openrouter" ? { reasoning: { effort: "low", exclude: true } } : {}),
  } as ChatCompletionCreateParamsStreaming;

  let stream: Stream<ChatCompletionChunk>;
  let first: IteratorResult<ChatCompletionChunk>;
  let iterator: AsyncIterator<ChatCompletionChunk>;

  try {
    stream = await client.chat.completions.create(params, { signal: request.signal });
    iterator = stream[Symbol.asyncIterator]();
    // El primer pedazo dice que modelo contesto de verdad (openrouter/free elige uno).
    first = await iterator.next();
  } catch (error) {
    const status = error instanceof OpenAI.APIError && error.status ? error.status : 502;
    return NextResponse.json({ error: describeBrainError(error, config) }, { status });
  }

  const model = first.done ? config.model : first.value.model || config.model;
  console.log(`[vera] respondio ${model} via ${config.label}`);

  const encoder = new TextEncoder();
  const filter = createSpokenFilter();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let truncated = false;

      const take = (chunk: ChatCompletionChunk) => {
        const choice = chunk.choices[0];

        if (choice?.finish_reason === "length") {
          truncated = true;
        }

        const spoken = choice?.delta?.content ? filter.push(choice.delta.content) : "";

        if (spoken) {
          controller.enqueue(encoder.encode(spoken));
        }
      };

      try {
        if (!first.done) {
          take(first.value);
        }

        for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
          take(next.value);
        }
      } catch {
        // Si el modelo corta a medias, entregamos lo que alcanzo a decir.
        truncated = true;
      }

      const rest = filter.end(truncated);

      if (rest) {
        controller.enqueue(encoder.encode(rest));
      }

      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Vera-Model": model,
    },
  });
}

function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (turn): turn is ChatTurn =>
        typeof turn === "object" &&
        turn !== null &&
        ((turn as ChatTurn).role === "user" || (turn as ChatTurn).role === "assistant") &&
        typeof (turn as ChatTurn).content === "string" &&
        (turn as ChatTurn).content.trim().length > 0,
    )
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_TURN_LENGTH) }))
    .slice(-MAX_TURNS);
}

function describeBrainError(error: unknown, config: BrainConfig) {
  const { label, keysFile } = config;

  if (error instanceof OpenAI.APIConnectionError) {
    if (config.provider === "freellmapi") {
      return `No pude conectar con FreeLLMAPI en ${config.baseURL}. Si lo corres en tu computadora, revisa que esté prendido; si usas una versión en la nube, pon su dirección en FREELLMAPI_BASE_URL dentro de ${keysFile}. Mientras, respondo con frases fijas.`;
    }

    return `No pude conectar con ${label}. Revisa tu internet; mientras, respondo con frases fijas.`;
  }

  if (error instanceof OpenAI.APIError) {
    if (error.status === 401 || error.status === 403) {
      return `${label} rechazó la llave. Revísala en ${keysFile}; mientras, respondo con frases fijas.`;
    }

    if (error.status === 402) {
      return `${label} pide créditos para ese modelo. Elige uno gratuito en ${keysFile}.`;
    }

    if (error.status === 404) {
      return `${label} no encontró el modelo "${config.model}". Revísalo en ${keysFile}.`;
    }

    if (error.status === 429) {
      return `${label} llegó al límite gratuito por ahora. Espera unos segundos o cambia de modelo en ${keysFile}.`;
    }
  }

  return "El cerebro de IA falló en esta respuesta; contesto con frases fijas.";
}
