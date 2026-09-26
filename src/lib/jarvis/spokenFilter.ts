/**
 * Filtro de lo que Vera dice en voz alta.
 *
 * Algunos modelos gratuitos "piensan en voz alta" dentro de la respuesta. Por
 * eso el prompt pide envolver lo hablado en <voz>...</voz>: solo eso pasa, y
 * sale en streaming en cuanto llega. Si el modelo ignora las marcas, al final
 * se intenta rescatar la respuesta quitando el razonamiento.
 */

const OPEN = "<voz>";
const CLOSE = "</voz>";

const REASONING_START =
  /^(el usuario|la usuaria|the user|user (says|asks|wants)|necesito|debo|tengo que|we need|i need|okay|ok,|let me|let's|vamos a ver|analicemos|analysis)/i;

export function createSpokenFilter() {
  let raw = "";
  let pending = "";
  let inside = false;
  let closed = false;
  let sawTag = false;

  /** Recibe un pedazo del modelo y regresa lo que ya se puede decir. */
  function push(chunk: string) {
    raw += chunk;

    if (closed) {
      return "";
    }

    pending += chunk;

    if (!inside) {
      const start = pending.toLowerCase().indexOf(OPEN);

      if (start === -1) {
        // Guardamos la cola por si la marca viene partida entre pedazos.
        pending = pending.slice(-(OPEN.length - 1));
        return "";
      }

      inside = true;
      sawTag = true;
      pending = pending.slice(start + OPEN.length);
    }

    const end = pending.toLowerCase().indexOf(CLOSE);

    if (end !== -1) {
      const out = pending.slice(0, end);
      pending = "";
      closed = true;
      return out;
    }

    const safe = Math.max(0, pending.length - (CLOSE.length - 1));
    const out = pending.slice(0, safe);
    pending = pending.slice(safe);
    return out;
  }

  /**
   * Al terminar: lo que quede dentro de la marca, o el rescate sin marcas.
   * `truncated` = el modelo se quedo sin espacio y la ultima frase va a medias.
   */
  function end(truncated = false) {
    if (sawTag) {
      const out = closed ? "" : pending.replace(/<\/?v?o?z?>?$/i, "");
      pending = "";
      return out;
    }

    return rescueAnswer(raw, truncated);
  }

  return { push, end };
}

/** Quita el razonamiento de un modelo que no uso las marcas <voz>. */
export function rescueAnswer(raw: string, truncated = false) {
  const answer = extractAnswer(raw);

  if (!truncated) {
    return answer;
  }

  // Si se corto, mejor callar la frase a medias que decir "tenemos 1,".
  const lastStop = Math.max(...[".", "!", "?", "…"].map((mark) => answer.lastIndexOf(mark)));
  const complete = lastStop === -1 ? "" : answer.slice(0, lastStop + 1).trim();
  return complete.length >= 20 ? complete : "";
}

function extractAnswer(raw: string) {
  let text = raw.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "").trim();

  // Formato de algunos modelos: "...analisis...assistantfinal Respuesta final".
  const harmony = text.match(/assistantfinal([\s\S]*)$/i);

  if (harmony) {
    text = harmony[1].trim();
  }

  const labeled = [...text.matchAll(/(?:respuesta(?: final)?|answer|final)\s*:\s*["“]?([\s\S]+?)["”]?\s*$/gi)];

  if (labeled.length > 0) {
    return labeled[labeled.length - 1][1].trim();
  }

  if (REASONING_START.test(text)) {
    return "";
  }

  return text;
}
