import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FISH_TTS_ENDPOINT = "https://api.fish.audio/v1/tts";
const MAX_TEXT_LENGTH = 800;

/**
 * Proxy opcional de Fish Audio para el prototipo.
 *
 * El command center funciona sin esta ruta: por defecto habla con la voz
 * gratuita del navegador. Si defines FISH_AUDIO_API_KEY (y opcionalmente
 * FISH_AUDIO_VOICE_ID), el selector "fish audio" del HUD empieza a usarla.
 */
export async function POST(request: Request) {
  const apiKey = process.env.FISH_AUDIO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Fish Audio no esta configurado. Uso la voz gratuita del navegador." },
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
      model: process.env.FISH_AUDIO_MODEL || "speech-1.6",
    },
    body: JSON.stringify({
      text: text.slice(0, MAX_TEXT_LENGTH),
      format: "mp3",
      reference_id: process.env.FISH_AUDIO_VOICE_ID || undefined,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Fish Audio rechazo la peticion de voz." },
      { status: response.status },
    );
  }

  const audio = await response.arrayBuffer();

  return new NextResponse(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
