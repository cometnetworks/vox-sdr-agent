import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export function getAiClient() {
  if (process.env.OPENROUTER_API_KEY) {
    const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS || "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);

    return {
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Vox SDR IA Agent",
        },
      }),
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      fallbackModels,
      provider: "openrouter",
    };
  }

  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    fallbackModels: [],
    provider: "openai",
  };
}

export async function generateStrategyForProspect(prospect: {
  name: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  linkedin?: string;
}) {
  const { client, model, fallbackModels, provider } = getAiClient();

  const messages = [
    {
      role: "system" as const,
      content:
        "Eres el Master Orchestrator del SDR IA de Vox Media Agency. Responde solo con JSON valido, sin markdown, sin texto antes o despues. No devuelvas un objeto vacio. Todo el contenido debe estar en espanol y con enfoque comercial ejecutivo.",
    },
    {
      role: "user" as const,
      content: `Analiza este prospecto para Vox Media Agency:

Nombre: ${prospect.name}
Email: ${prospect.email}
Empresa: ${prospect.company}
Cargo: ${prospect.title}
Celular: ${prospect.phone || "No disponible"}
LinkedIn: ${prospect.linkedin || "No disponible"}

Devuelve JSON con:
{
  "score": number,
  "tier": "Hot" | "Warm" | "Cold",
  "trigger": string,
  "painPoint": string,
  "voxAngle": string,
  "recommendedOffer": "Datos" | "Reuniones" | "Eventos",
  "recommendedChannel": "Email" | "LinkedIn" | "Voz",
  "emailSubject": string,
  "emailBody": string,
  "brief": string,
  "nextStep": string
}`,
    },
  ];

  if (provider === "openrouter") {
    const requestBody = {
      model,
      messages,
      max_tokens: 650,
      temperature: 0.4,
      extra_body: {
        models: fallbackModels,
      },
    } as Parameters<typeof client.chat.completions.create>[0] & {
      extra_body: {
        models: string[];
      };
    };

    const response = (await client.chat.completions.create({
      ...requestBody,
    })) as ChatCompletion;

    return response.choices[0]?.message?.content || "{}";
  }

  const response = await client.responses.create({
    model,
    input: messages,
  });

  return response.output_text;
}

export function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`AI did not return JSON: ${trimmed.slice(0, 200)}`);
  }

  return JSON.parse(trimmed.slice(start, end + 1));
}

export function createFallbackStrategy(prospect: {
  name: string;
  company: string;
  title: string;
}) {
  const isSenior =
    /director|head|vp|chief|c-level|ceo|cmo|cro|ciso|cio|gerente|manager/i.test(prospect.title);
  const score = isSenior ? 72 : 58;
  const tier = score >= 80 ? "Hot" : score >= 60 ? "Warm" : "Cold";

  return {
    score,
    tier,
    trigger: `Contacto ${isSenior ? "con influencia comercial" : "por validar"} en ${prospect.company}`,
    painPoint: "Necesidad probable de generar conversaciones comerciales mejor calificadas.",
    voxAngle:
      "Vox puede ayudar a validar cuentas, encontrar decisores y convertir prospeccion en reuniones reales.",
    recommendedOffer: "Reuniones",
    recommendedChannel: "Email",
    emailSubject: `Conversaciones correctas para ${prospect.company}`,
    emailBody: `Hola ${prospect.name},\n\nVoy directo. En muchas empresas B2B el problema no es falta de actividad comercial, sino entrar a conversaciones que realmente justifican el tiempo del equipo.\n\nEn Vox ayudamos a convertir cuentas objetivo en reuniones con decisores verificados en LATAM.\n\nSi tiene sentido para ${prospect.company}, puedo compartirte dos rutas: datos verificados o reuniones ya calificadas.\n\n¿Te hace sentido revisarlo en 15 minutos?`,
    brief: `${prospect.company} debe validarse comercialmente. El contacto ${prospect.name} (${prospect.title}) puede ser una puerta de entrada para entender necesidad de pipeline, datos o reuniones.`,
    nextStep: "Revisar manualmente y decidir si se aprueba outreach.",
  };
}
