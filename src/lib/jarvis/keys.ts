/**
 * Solo servidor. Lee las llaves desde llaves/*.txt (visibles en Finder y fuera
 * de git) y, si no estan ahi, desde el entorno. Se leen en cada peticion para
 * que pegar una llave no exija reiniciar el servidor.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const KEYS_DIR = join(process.cwd(), "llaves");

export const DEFAULT_FISH_MODEL = "s2.1-pro-free";
export const DEFAULT_BRAIN_MODEL = "openrouter/free";

function clean(value: string) {
  return value.trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Lee lineas CLAVE=valor. Si alguien pego solo la llave en su propia linea,
 * se toma como `bareKey`.
 */
async function readKeyFile(fileName: string, bareKey: string) {
  const values: Record<string, string> = {};

  try {
    const raw = await readFile(join(KEYS_DIR, fileName), "utf8");
    let bareLine = "";

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equals = trimmed.indexOf("=");

      if (equals === -1) {
        bareLine ||= clean(trimmed);
        continue;
      }

      values[trimmed.slice(0, equals).trim()] = clean(trimmed.slice(equals + 1));
    }

    if (!values[bareKey] && bareLine) {
      values[bareKey] = bareLine;
    }
  } catch {
    // Sin archivo seguimos con las variables de entorno.
  }

  return values;
}

export type FishConfig = {
  apiKey: string;
  voiceId: string;
  model: string;
  baseURL: string;
};

export async function getFishConfig(): Promise<FishConfig> {
  const file = await readKeyFile("fish-audio.txt", "FISH_AUDIO_API_KEY");

  return {
    apiKey: file.FISH_AUDIO_API_KEY || process.env.FISH_AUDIO_API_KEY || "",
    voiceId: file.FISH_AUDIO_VOICE_ID || process.env.FISH_AUDIO_VOICE_ID || "",
    model: file.FISH_AUDIO_MODEL || process.env.FISH_AUDIO_MODEL || DEFAULT_FISH_MODEL,
    baseURL: process.env.FISH_AUDIO_BASE_URL || "https://api.fish.audio",
  };
}

export type BrainConfig = {
  apiKey: string;
  model: string;
  baseURL: string;
};

export async function getBrainConfig(): Promise<BrainConfig> {
  const file = await readKeyFile("openrouter.txt", "OPENROUTER_API_KEY");

  return {
    apiKey: file.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "",
    model: file.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || DEFAULT_BRAIN_MODEL,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  };
}
