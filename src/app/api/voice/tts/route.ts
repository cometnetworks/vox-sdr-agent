import { NextResponse } from "next/server";

import { getFishConfig } from "@/lib/jarvis/keys";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 800;

/**
 * Voz de Fish Audio para el command center.
 *
 * GET sin `text`: avisa si hay llave. GET con `?text=`: devuelve el audio en
 * streaming, asi un <audio src=...> empieza a sonar antes de terminar de bajar.
 * La llave se pega en llaves/fish-audio.txt (o en .env.local).
 */
export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text");

  if (text === null) {
    const config = await getFishConfig();

    return NextResponse.json({
      available: Boolean(config.apiKey),
      model: config.model,
      hasVoice: Boolean(config.voiceId),
    });
  }

  return synthesize(text.trim(), request.signal);
}

async function synthesize(text: string, signal: AbortSignal) {
  const config = await getFishConfig();

  if (!config.apiKey) {
    return NextResponse.json(
      {
        error:
          "Fish Audio no tiene llave. Pégala en llaves/fish-audio.txt y recarga la página. Mientras, uso la voz del navegador.",
      },
      { status: 501 },
    );
  }

  if (!text) {
    return NextResponse.json({ error: "Falta el texto a sintetizar." }, { status: 400 });
  }

  const upstream = await fetch(`${config.baseURL}/v1/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      model: config.model,
    },
    body: JSON.stringify({
      text: text.slice(0, MAX_TEXT_LENGTH),
      format: "mp3",
      // "balanced" baja el tiempo al primer audio (~300 ms) para conversar.
      latency: "balanced",
      reference_id: config.voiceId || undefined,
    }),
    cache: "no-store",
    signal,
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { error: "No pude conectar con Fish Audio. Uso la voz del navegador." },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: describeFishError(upstream.status) }, { status: upstream.status || 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}

function describeFishError(status: number) {
  if (status === 401 || status === 403) {
    return "Fish Audio rechazó la llave. Revísala en llaves/fish-audio.txt. Uso la voz del navegador.";
  }

  if (status === 402) {
    return "Fish Audio pide saldo para este modelo. Usa el modelo gratuito s2.1-pro-free. Uso la voz del navegador.";
  }

  if (status === 404) {
    return "Fish Audio no encontró la voz. Revisa FISH_AUDIO_VOICE_ID en llaves/fish-audio.txt. Uso la voz del navegador.";
  }

  if (status === 429) {
    return "Fish Audio llegó al límite de uso gratuito por ahora. Uso la voz del navegador.";
  }

  return `Fish Audio falló (${status}). Uso la voz del navegador.`;
}
