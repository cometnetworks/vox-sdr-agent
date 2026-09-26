import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FISH_TTS_ENDPOINT = "https://api.fish.audio/v1/tts";
const MAX_TEXT_LENGTH = 800;

// Modelo gratuito de Fish Audio (uso justo, sin costo por caracter).
const DEFAULT_MODEL = "s2.1-pro-free";

/**
 * Proxy opcional de Fish Audio para el command center.
 *
 * Sin FISH_AUDIO_API_KEY el HUD habla con la voz del navegador. Con la llave,
 * el HUD cambia solo a Fish Audio. FISH_AUDIO_VOICE_ID elige la voz.
 */
export async function GET() {
  return NextResponse.json({
    available: Boolean(process.env.FISH_AUDIO_API_KEY),
    model: process.env.FISH_AUDIO_MODEL || DEFAULT_MODEL,
    hasVoice: Boolean(process.env.FISH_AUDIO_VOICE_ID),
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.FISH_AUDIO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Fish Audio no tiene llave. Agrega FISH_AUDIO_API_KEY en .env.local y reinicia npm run dev. Mientras, uso la voz del navegador.",
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
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      model: process.env.FISH_AUDIO_MODEL || DEFAULT_MODEL,
    },
    body: JSON.stringify({
      text: text.slice(0, MAX_TEXT_LENGTH),
      format: "mp3",
      reference_id: process.env.FISH_AUDIO_VOICE_ID || undefined,
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
    return "Fish Audio rechazo la llave. Revisa FISH_AUDIO_API_KEY en .env.local. Uso la voz del navegador.";
  }

  if (status === 402) {
    return "Fish Audio pide saldo para este modelo. Usa FISH_AUDIO_MODEL=s2.1-pro-free. Uso la voz del navegador.";
  }

  if (status === 404) {
    return "Fish Audio no encontro la voz. Revisa FISH_AUDIO_VOICE_ID. Uso la voz del navegador.";
  }

  if (status === 429) {
    return "Fish Audio llego al limite de uso gratuito por ahora. Uso la voz del navegador.";
  }

  return `Fish Audio fallo (${status}). Uso la voz del navegador.`;
}
