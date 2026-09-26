/**
 * Motor de voz gratuito para el prototipo del command center.
 *
 * Reconocimiento (STT): Web Speech API del navegador. Es gratis, no necesita
 * llaves y funciona en Chrome, Edge y Safari.
 *
 * Sintesis (TTS): dos proveedores intercambiables.
 *   - "browser": speechSynthesis nativo. Gratis y sin configuracion.
 *   - "fish": Fish Audio via /api/voice/tts. Solo se activa si el servidor
 *     tiene llave; si no, o si falla, el motor regresa al navegador.
 *
 * Para bajar la latencia, la respuesta se dice frase por frase (SpeechQueue):
 * la primera frase suena mientras las siguientes todavia se generan.
 */

export type TtsProvider = "browser" | "fish";

export type SpeechResult = {
  /** Posicion del resultado en la sesion; sirve para no procesarlo dos veces. */
  index: number;
  transcript: string;
  isFinal: boolean;
};

type SpeechRecognitionAlternativeLike = { transcript: string };

type SpeechRecognitionResultLike = {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const scope = window as SpeechWindow;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionCtor() !== null;
}

export type RecognizerHandlers = {
  onResult: (result: SpeechResult) => void;
  onError: (message: string) => void;
  onEnd: () => void;
  /** Cada arranque de sesion reinicia los indices de resultados. */
  onStart?: () => void;
  lang?: string;
};

export type Recognizer = {
  start: () => void;
  stop: () => void;
};

export function createRecognizer(handlers: RecognizerHandlers): Recognizer | null {
  const Ctor = getSpeechRecognitionCtor();

  if (!Ctor) {
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = handlers.lang ?? "es-MX";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const alternative = result[0];

      if (!alternative) {
        continue;
      }

      handlers.onResult({
        index,
        transcript: alternative.transcript.trim(),
        isFinal: result.isFinal,
      });
    }
  };

  recognition.onerror = (event) => {
    handlers.onError(describeRecognitionError(event.error));
  };

  recognition.onstart = () => {
    handlers.onStart?.();
  };

  recognition.onend = () => {
    running = false;
    handlers.onEnd();
  };

  let running = false;

  return {
    start() {
      if (running) {
        return;
      }

      try {
        recognition.start();
        running = true;
      } catch {
        // start() lanza si ya hay una sesion viva. La ignoramos a proposito.
      }
    },
    stop() {
      running = false;
      recognition.stop();
    },
  };
}

function describeRecognitionError(code: string) {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "El microfono esta bloqueado. Autorizalo en el navegador y vuelve a intentar.";
  }

  if (code === "no-speech") {
    return "No escuche nada. Habla mas cerca del microfono.";
  }

  if (code === "audio-capture") {
    return "No encontre un microfono disponible.";
  }

  if (code === "network") {
    return "El reconocimiento de voz perdio la red.";
  }

  return `Fallo el reconocimiento de voz (${code}).`;
}

/**
 * Las voces del navegador varian mucho en calidad. Las compactas del sistema
 * suenan roboticas; las "Premium"/"Mejorada" de macOS, las "Natural" de Edge y
 * las de red de Google suenan mucho mas humanas. Las ordenamos por eso.
 */
const QUALITY_HINTS: Array<[RegExp, number]> = [
  [/premium/i, 60],
  [/natural|neural/i, 55],
  [/mejorad|enhanced/i, 45],
  [/online/i, 35],
  [/google/i, 30],
  [/siri/i, 25],
];

const LANG_RANK: Array<[RegExp, number]> = [
  [/^es[-_]MX/i, 12],
  [/^es[-_](US|419)/i, 9],
  [/^es/i, 5],
];

function scoreVoice(voice: SpeechSynthesisVoice) {
  let score = 0;

  for (const [pattern, weight] of QUALITY_HINTS) {
    if (pattern.test(voice.name)) {
      score += weight;
    }
  }

  const lang = LANG_RANK.find(([pattern]) => pattern.test(voice.lang));
  return score + (lang ? lang[1] : 0);
}

const NO_VOICES: SpeechSynthesisVoice[] = [];
let voiceCache: SpeechSynthesisVoice[] = NO_VOICES;

function readSpanishVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return NO_VOICES;
  }

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => /^es/i.test(voice.lang))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/**
 * Chrome carga las voces en diferido y avisa con "voiceschanged". Esto se usa
 * con useSyncExternalStore; el snapshot se cachea para devolver siempre la
 * misma referencia mientras la lista no cambie.
 */
export function subscribeVoices(listener: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return () => {};
  }

  const refresh = () => {
    voiceCache = readSpanishVoices();
    listener();
  };

  voiceCache = readSpanishVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
}

export function getVoicesSnapshot() {
  return voiceCache;
}

export function getServerVoicesSnapshot() {
  return NO_VOICES;
}

export function pickSpanishVoice(preferredName?: string): SpeechSynthesisVoice | null {
  const voices = readSpanishVoices();

  if (preferredName) {
    const preferred = voices.find((voice) => voice.name === preferredName);

    if (preferred) {
      return preferred;
    }
  }

  return voices[0] ?? null;
}

/**
 * Deja el texto listo para voz: lo que se lee bien en pantalla ("V.E.R.A.",
 * "1,240", "11.4%", "+180 /sem", "2h") suena mal si se pronuncia literal.
 */
export function toSpeech(text: string) {
  return text
    .replace(/[*_#`]+/g, "")
    .replace(/V\.E\.R\.A\./g, "Vera")
    .replace(/(\d),(\d{3})\b/g, "$1$2")
    .replace(/(\d+(?:\.\d+)?)\s?%/g, "$1 por ciento")
    .replace(/\+(\d+)\s*\/\s*sem\b/g, "más $1 por semana")
    .replace(/\s*\/\s*sem\b/g, " por semana")
    .replace(/\b(\d+)\s?h\b/g, "$1 horas")
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Corta texto que llega en pedazos (streaming) en frases completas. La primera
 * se corta antes, en una coma si hace falta, para que la voz arranque pronto.
 */
export class SentenceSplitter {
  private buffer = "";
  private emitted = 0;

  constructor(private readonly emit: (sentence: string) => void) {}

  push(chunk: string) {
    this.buffer += chunk;
    this.drain(false);
  }

  flush() {
    this.drain(true);
  }

  private drain(final: boolean) {
    // Fin de frase seguido de espacio: "11.4" no corta, "Listo. Ahora" si.
    const boundary = /[.!?…]+["»”)]*\s+/g;
    let consumed = 0;
    let match: RegExpExecArray | null;

    while ((match = boundary.exec(this.buffer))) {
      const end = match.index + match[0].length;
      this.send(this.buffer.slice(consumed, end));
      consumed = end;
    }

    this.buffer = this.buffer.slice(consumed);

    const limit = this.emitted === 0 ? 90 : 180;

    if (!final && this.buffer.length > limit) {
      const cut = Math.max(this.buffer.lastIndexOf(", "), this.buffer.lastIndexOf("; "));

      if (cut > 30) {
        this.send(this.buffer.slice(0, cut + 1));
        this.buffer = this.buffer.slice(cut + 2);
      }
    }

    if (final) {
      this.send(this.buffer);
      this.buffer = "";
    }
  }

  private send(piece: string) {
    const sentence = piece.trim();

    if (sentence) {
      this.emitted += 1;
      this.emit(sentence);
    }
  }
}

export type QueueOptions = {
  provider: TtsProvider;
  /** Nombre de la voz del navegador elegida; vacio = la mejor disponible. */
  voiceName?: string;
  /** Cuando empieza a sonar la primera frase. */
  onStart?: () => void;
  /** Cuando ya se dijo todo y no vienen mas frases. */
  onIdle?: () => void;
  onFallback?: (reason: string) => void;
};

type QueueItem = { text: string; audio: HTMLAudioElement | null };

/**
 * Cola de frases. Con Fish, cada frase se pide en cuanto llega (el navegador la
 * va bajando) y se reproduce en orden; si Fish falla, esa y las siguientes van
 * con la voz del navegador.
 */
export class SpeechQueue {
  /** Solo una cola suena a la vez; una nueva calla a la anterior. */
  static active: SpeechQueue | null = null;

  private items: QueueItem[] = [];
  private current: HTMLAudioElement | null = null;
  private playing = false;
  private finished = false;
  private started = false;
  private idle = false;
  private cancelled = false;
  private useBrowser: boolean;

  constructor(private readonly options: QueueOptions) {
    SpeechQueue.active?.cancel();
    SpeechQueue.active = this;
    this.useBrowser = options.provider !== "fish";
  }

  push(rawText: string) {
    const text = toSpeech(rawText);

    if (!text || this.cancelled) {
      return;
    }

    const audio = this.useBrowser ? null : new Audio(`/api/voice/tts?text=${encodeURIComponent(text)}`);

    if (audio) {
      audio.preload = "auto";
    }

    this.items.push({ text, audio });
    this.next();
  }

  finish() {
    this.finished = true;
    this.maybeIdle();
  }

  cancel() {
    this.cancelled = true;
    this.items.forEach((item) => item.audio?.removeAttribute("src"));
    this.items = [];

    if (this.current) {
      this.current.pause();
      this.current.removeAttribute("src");
      this.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (SpeechQueue.active === this) {
      SpeechQueue.active = null;
    }
  }

  private next() {
    if (this.playing || this.cancelled) {
      return;
    }

    const item = this.items.shift();

    if (!item) {
      this.maybeIdle();
      return;
    }

    this.playing = true;

    const done = () => {
      this.current = null;
      this.playing = false;
      this.next();
    };

    if (item.audio && !this.useBrowser) {
      this.playFish(item, done);
    } else {
      this.playBrowser(item.text, done);
    }
  }

  private playFish(item: QueueItem, done: () => void) {
    const audio = item.audio as HTMLAudioElement;
    this.current = audio;

    const fallBack = async () => {
      if (this.cancelled || this.useBrowser) {
        if (!this.cancelled) {
          this.playBrowser(item.text, done);
        }
        return;
      }

      // Pedimos otra vez para leer el motivo del error y avisarlo en el HUD.
      const reason = await fetch(audio.src, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ error?: string }>)
        .then((body) => body.error)
        .catch(() => undefined);

      this.switchToBrowser();
      this.options.onFallback?.(reason || "Fish Audio no respondió. Uso la voz del navegador.");

      if (!this.cancelled) {
        this.playBrowser(item.text, done);
      }
    };

    audio.onplaying = () => this.markStarted();
    audio.onended = done;
    audio.onerror = () => void fallBack();
    audio.play().catch(() => void fallBack());
  }

  private switchToBrowser() {
    this.useBrowser = true;
    this.items.forEach((queued) => {
      queued.audio?.removeAttribute("src");
      queued.audio = null;
    });
  }

  private playBrowser(text: string, done: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      done();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickSpanishVoice(this.options.voiceName);

    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = voice?.lang ?? "es-MX";
    // Tono y ritmo neutros: bajar el pitch hace sonar la voz mas sintetica.
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => this.markStarted();
    utterance.onend = done;
    utterance.onerror = done;

    window.speechSynthesis.speak(utterance);
  }

  private markStarted() {
    if (!this.started) {
      this.started = true;
      this.options.onStart?.();
    }
  }

  private maybeIdle() {
    if (this.finished && !this.playing && this.items.length === 0 && !this.idle && !this.cancelled) {
      this.idle = true;

      if (SpeechQueue.active === this) {
        SpeechQueue.active = null;
      }

      this.options.onIdle?.();
    }
  }
}

export function cancelSpeech() {
  SpeechQueue.active?.cancel();

  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Dice un texto completo de una vez (por ejemplo, la frase de prueba de voz). */
export function speak(text: string, options: QueueOptions) {
  const queue = new SpeechQueue(options);
  const splitter = new SentenceSplitter((sentence) => queue.push(sentence));
  splitter.push(text);
  splitter.flush();
  queue.finish();
  return queue;
}
