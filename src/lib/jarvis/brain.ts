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

function firstName() {
  return hudIdentity.operator.split(" ")[0];
}

function vitalValue(id: string) {
  return vitals.find((vital) => vital.id === id)?.value ?? "";
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/*
 * Las respuestas se escriben como se dicen: con acentos, frases cortas y sin
 * anglicismos ni abreviaturas. Un texto sin acentos hace que cualquier motor de
 * voz ponga mal el enfasis y suene robotico.
 */
export function respond(rawInput: string): BrainReply {
  const input = normalize(rawInput);

  if (!input) {
    return { text: "No alcancé a escucharte. ¿Me lo repites?", action: { kind: "none" } };
  }

  if (matches(input, ["silencio", "callate", "guarda silencio", "para de hablar"])) {
    return { text: "Entendido. Me quedo en silencio.", action: { kind: "mute" } };
  }

  if (matches(input, ["limpia", "borra", "reinicia la consola", "clear"])) {
    return { text: "Listo, consola limpia. Te sigo escuchando.", action: { kind: "clear" } };
  }

  if (matches(input, ["hola", "buenos dias", "buenas tardes", "quien eres", "presentate"])) {
    return {
      text: `Hola, ${firstName()}. Soy Javier, tu ejecutivo de ventas con inteligencia artificial en ${hudIdentity.org}. Pregúntame por el estado del pipeline, los prospectos, las directivas o la bitácora.`,
      action: { kind: "focus", panel: "core" },
    };
  }

  if (matches(input, ["estado", "status", "como vamos", "resumen", "reporte"])) {
    return {
      text: `Vamos bien. Tenemos ${vitalValue("prospects")} prospectos activos y ${vitalValue("outreach")} mensajes enviados, con una tasa de respuesta del ${vitalValue("reply")}. Llevamos ${primaryDirective.value} de ${primaryDirective.target} reuniones agendadas.`,
      action: { kind: "focus", panel: "vitals" },
    };
  }

  if (matches(input, ["prospecto", "cuenta", "base", "lead"])) {
    const weekly = vitals.find((vital) => vital.id === "prospects")?.delta.replace(/[^\d]/g, "");
    return {
      text: `Tenemos ${vitalValue("prospects")} prospectos activos, y la base crece unos ${weekly} por semana. El análisis de hoy dejó tres cuentas calientes.`,
      action: { kind: "focus", panel: "vitals" },
    };
  }

  if (matches(input, ["directiva", "tarea", "pendiente", "prioridad", "que sigue"])) {
    const [first, second, third] = directives.map((item) => item.spoken);
    return {
      text: `Tienes tres pendientes. Primero, ${first}. Después, ${second}. Y por último, ${third}.`,
      action: { kind: "focus", panel: "directives" },
    };
  }

  if (matches(input, ["evento", "bitacora", "historial", "linea de tiempo", "log"])) {
    const list = trail.map((item) => capitalize(item.spoken)).join(". ");
    return {
      text: `Esto es lo que pasó hoy. ${list}.`,
      action: { kind: "focus", panel: "trail" },
    };
  }

  if (matches(input, ["reunion", "meta", "objetivo", "cuanto falta"])) {
    const remaining = primaryDirective.target - primaryDirective.value;
    const weekly = primaryDirective.weekly.replace(/[^\d]/g, "");
    return {
      text: `Llevamos ${primaryDirective.value} de ${primaryDirective.target} reuniones y nos faltan ${remaining}. Vamos sumando unas ${weekly} por semana, así que a este ritmo llegamos a la meta en ${primaryDirective.paceSpoken}.`,
      action: { kind: "focus", panel: "core" },
    };
  }

  if (matches(input, ["llamada", "llamar", "twilio", "telefono"])) {
    return {
      text: "Todavía no hago llamadas reales. Primero hay que terminar las pruebas internas con Twilio, y que tú las apruebes.",
      action: { kind: "none" },
    };
  }

  if (matches(input, ["gracias", "listo", "eso es todo"])) {
    return { text: `A la orden, ${firstName()}. Aquí sigo.`, action: { kind: "none" } };
  }

  return {
    text: `Anoté: "${rawInput.trim()}". Por ahora puedo contarte el estado del pipeline, los prospectos, las directivas, la bitácora o cómo vamos con la meta.`,
    action: { kind: "none" },
  };
}
