/**
 * Cerebro local del prototipo. No llama a ningun modelo: interpreta la orden
 * hablada con reglas simples sobre los datos del HUD para que la demo funcione
 * sin llaves ni backend.
 */

import {
  directives,
  hudIdentity,
  primaryDirective,
  trail,
  vitals,
} from "./hudData";

export type BrainAction =
  | { kind: "none" }
  | { kind: "focus"; panel: "vitals" | "directives" | "trail" | "core" }
  | { kind: "clear" }
  | { kind: "mute" };

export type BrainReply = {
  text: string;
  action: BrainAction;
};

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matches(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}

export function respond(rawInput: string): BrainReply {
  const input = normalize(rawInput);

  if (!input) {
    return { text: "No alcance a escucharte. Repite la orden.", action: { kind: "none" } };
  }

  if (matches(input, ["silencio", "callate", "guarda silencio", "para de hablar"])) {
    return { text: "Entendido. Modo silencioso.", action: { kind: "mute" } };
  }

  if (matches(input, ["limpia", "borra", "reinicia la consola", "clear"])) {
    return { text: "Consola limpia. Sigo escuchando.", action: { kind: "clear" } };
  }

  if (matches(input, ["hola", "buenos dias", "buenas tardes", "quien eres", "presentate"])) {
    return {
      text: `${hudIdentity.code}. ${hudIdentity.expansion}. Al mando de ${hudIdentity.operator} en ${hudIdentity.org}. Pide estado, prospectos, directivas o bitacora.`,
      action: { kind: "focus", panel: "core" },
    };
  }

  if (matches(input, ["estado", "status", "como vamos", "resumen", "reporte"])) {
    const meetings = vitals.find((vital) => vital.id === "meetings");
    const reply = vitals.map((vital) => `${vital.label.toLowerCase()}, ${vital.value}`).join("; ");
    return {
      text: `Estado del pipeline: ${reply}. Vamos en ${meetings?.value ?? primaryDirective.value} de ${primaryDirective.target} reuniones.`,
      action: { kind: "focus", panel: "vitals" },
    };
  }

  if (matches(input, ["prospecto", "cuenta", "base", "lead"])) {
    const prospects = vitals.find((vital) => vital.id === "prospects");
    return {
      text: `Tengo ${prospects?.value ?? "1,240"} prospectos activos, creciendo ${prospects?.delta ?? "+180 /sem"}. El scoring de hoy dejo tres cuentas calientes.`,
      action: { kind: "focus", panel: "vitals" },
    };
  }

  if (matches(input, ["directiva", "tarea", "pendiente", "prioridad", "que sigue"])) {
    const list = directives.map((item, index) => `${index + 1}. ${item.text}, en ${item.eta}`).join(". ");
    return {
      text: `Tres directivas activas. ${list}.`,
      action: { kind: "focus", panel: "directives" },
    };
  }

  if (matches(input, ["evento", "bitacora", "historial", "linea de tiempo", "log"])) {
    const list = trail.map((item) => `${item.time}, ${item.label}`).join("; ");
    return {
      text: `Bitacora de hoy: ${list}.`,
      action: { kind: "focus", panel: "trail" },
    };
  }

  if (matches(input, ["reunion", "meta", "objetivo", "cuanto falta"])) {
    const remaining = primaryDirective.target - primaryDirective.value;
    return {
      text: `Directiva primaria: ${primaryDirective.value} de ${primaryDirective.target} reuniones. Faltan ${remaining}, avanzamos ${primaryDirective.weekly} por semana y a este ritmo cerramos en ${primaryDirective.pace}.`,
      action: { kind: "focus", panel: "core" },
    };
  }

  if (matches(input, ["llamada", "llamar", "twilio", "telefono"])) {
    return {
      text: "Las llamadas reales siguen bloqueadas. Solo pruebas internas hasta validar Twilio y la aprobacion manual.",
      action: { kind: "none" },
    };
  }

  if (matches(input, ["gracias", "listo", "eso es todo"])) {
    return { text: "A la orden. Sigo en guardia.", action: { kind: "none" } };
  }

  return {
    text: `Registre "${rawInput.trim()}" en la bitacora. Este prototipo responde a estado, prospectos, directivas, bitacora, meta y silencio.`,
    action: { kind: "none" },
  };
}
