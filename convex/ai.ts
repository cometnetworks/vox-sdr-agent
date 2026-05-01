import OpenAI from "openai";
import { v } from "convex/values";
import { action } from "./_generated/server";

const model = process.env.OPENAI_MODEL || "gpt-5-mini";

export const generateProspectStrategy = action({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.string(),
    title: v.string(),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  },
  handler: async (_ctx, prospect) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Eres el Master Orchestrator del SDR IA de Vox Media Agency. Responde en JSON valido, en espanol, con enfoque comercial ejecutivo.",
        },
        {
          role: "user",
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
      ],
    });

    return response.output_text;
  },
});

