import { NextResponse } from "next/server";

import { getFishConfig } from "@/lib/jarvis/fishConfig";

export const dynamic = "force-dynamic";

const FISH_TTS_ENDPOINT = "https://api.fish.audio/v1/tts";
const MAX_TEXT_LENGTH = 800;

/**
 * Proxy opcional de Fish Audio para el command center.
 *
 * La llave se pega en llaves/fish-audio.txt (o en .env.local). Sin llave el HUD
 * habla con la voz del navegador; con llave cambia solo a Fish Audio.
 */
export async function GET() {
  const config = await getFishConfig();

  return NextResponse.json({
    available: Boolean(config.apiKey),
    model: config.model,
    hasVoice: Boolean(config.voiceId),
  });
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "Falta el texto a sintetizar." }, { status: 400 });
  }

  const response = await fetch(FISH_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      model: config.model,
    },
    body: JSON.stringify({
      text: text.slice(0, MAX_TEXT_LENGTH),
      format: "mp3",
      reference_id: config.voiceId || undefined,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: describeFishError(response.status) }, { status: response.status });
  }

  const audio = await response.arrayBuffer();

  return new NextResponse(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
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

  return `Fish Audio fallo (${status}). Uso la voz del navegador.`;
}
