import OpenAI from "openai";

export function getAiClient() {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Vox SDR IA Agent",
        },
      }),
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
      provider: "openrouter",
    };
  }

  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
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
  const { client, model, provider } = getAiClient();

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
    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 350,
      temperature: 0.4,
    });

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

