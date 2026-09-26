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
// FreeLLMAPI corre en tu computadora por defecto. "auto:fast" rota entre
// proveedores gratuitos priorizando velocidad, que es lo que importa en voz.
export const DEFAULT_FREELLMAPI_URL = "http://localhost:3001/v1";
export const DEFAULT_FREELLMAPI_MODEL = "auto:fast";

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

export type BrainProvider = "freellmapi" | "openrouter";

export type BrainConfig = {
  provider: BrainProvider;
  /** Nombre para mostrar en el HUD y en los avisos. */
  label: string;
  /** Archivo de llaves donde el usuario corrige la configuracion. */
  keysFile: string;
  apiKey: string;
  model: string;
  baseURL: string;
};

/**
 * Si hay llave de FreeLLMAPI se usa esa (rota entre proveedores gratis y
 * rapidos); si no, OpenRouter, que es el proveedor de IA del proyecto.
 */
export async function getBrainConfig(): Promise<BrainConfig> {
  const free = await readKeyFile("freellmapi.txt", "FREELLMAPI_API_KEY");
  const freeKey = free.FREELLMAPI_API_KEY || process.env.FREELLMAPI_API_KEY || "";

  if (freeKey) {
    return {
      provider: "freellmapi",
      label: "FreeLLMAPI",
      keysFile: "llaves/freellmapi.txt",
      apiKey: freeKey,
      model: free.FREELLMAPI_MODEL || process.env.FREELLMAPI_MODEL || DEFAULT_FREELLMAPI_MODEL,
      baseURL: (free.FREELLMAPI_BASE_URL || process.env.FREELLMAPI_BASE_URL || DEFAULT_FREELLMAPI_URL).replace(
        /\/+$/,
        "",
      ),
    };
  }

  const file = await readKeyFile("openrouter.txt", "OPENROUTER_API_KEY");

  return {
    provider: "openrouter",
    label: "OpenRouter",
    keysFile: "llaves/openrouter.txt",
    apiKey: file.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "",
    model: file.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || DEFAULT_BRAIN_MODEL,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  };
}
