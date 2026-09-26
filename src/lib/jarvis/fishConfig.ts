/**
 * Solo servidor. Lee la configuracion de Fish Audio desde llaves/fish-audio.txt
 * (visible en Finder y fuera de git) y, si no esta ahi, desde el entorno.
 * Se lee en cada peticion para que pegar la llave no exija reiniciar.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const DEFAULT_FISH_MODEL = "s2.1-pro-free";

export type FishConfig = {
  apiKey: string;
  voiceId: string;
  model: string;
};

const KEYS_FILE = join(process.cwd(), "llaves", "fish-audio.txt");

function clean(value: string) {
  return value.trim().replace(/^["']|["']$/g, "").trim();
}

async function readKeysFile() {
  const values: Record<string, string> = {};

  try {
    const raw = await readFile(KEYS_FILE, "utf8");
    let bareLine = "";

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equals = trimmed.indexOf("=");

      if (equals === -1) {
        // Si alguien pego solo la llave en su propia linea, tambien la tomamos.
        bareLine ||= clean(trimmed);
        continue;
      }

      values[trimmed.slice(0, equals).trim()] = clean(trimmed.slice(equals + 1));
    }

    if (!values.FISH_AUDIO_API_KEY && bareLine) {
      values.FISH_AUDIO_API_KEY = bareLine;
    }
  } catch {
    // Sin archivo seguimos con las variables de entorno.
  }

  return values;
}

export async function getFishConfig(): Promise<FishConfig> {
  const file = await readKeysFile();

  return {
    apiKey: file.FISH_AUDIO_API_KEY || process.env.FISH_AUDIO_API_KEY || "",
    voiceId: file.FISH_AUDIO_VOICE_ID || process.env.FISH_AUDIO_VOICE_ID || "",
    model: file.FISH_AUDIO_MODEL || process.env.FISH_AUDIO_MODEL || DEFAULT_FISH_MODEL,
  };
}
