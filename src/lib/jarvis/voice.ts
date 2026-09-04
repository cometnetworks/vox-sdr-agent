/**
 * Motor de voz gratuito para el prototipo del command center.
 *
 * Reconocimiento (STT): Web Speech API del navegador. Es gratis, no necesita
 * llaves y funciona en Chrome, Edge y Safari.
 *
 * Sintesis (TTS): dos proveedores intercambiables.
 *   - "browser": speechSynthesis nativo. Gratis y sin configuracion.
 *   - "fish": Fish Audio via /api/voice/tts. Solo se activa si el servidor
 *     tiene FISH_AUDIO_API_KEY; si no, el motor regresa al navegador.
 */

export type TtsProvider = "browser" | "fish";

export type SpeechResult = {
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
        transcript: alternative.transcript.trim(),
        isFinal: result.isFinal,
      });
    }
  };

  recognition.onerror = (event) => {
    handlers.onError(describeRecognitionError(event.error));
  };

  recognition.onend = () => {
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

export function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  if (voices.length === 0) {
    return null;
  }

  return (
    voices.find((voice) => /^es-MX/i.test(voice.lang)) ??
    voices.find((voice) => /^es/i.test(voice.lang)) ??
    null
  );
}

let activeAudio: HTMLAudioElement | null = null;

export function cancelSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
}

export type SpeakOptions = {
  provider: TtsProvider;
  onStart?: () => void;
  onEnd?: () => void;
  onFallback?: (reason: string) => void;
};

export async function speak(text: string, options: SpeakOptions) {
  cancelSpeech();

  if (!text.trim()) {
    return;
  }

  if (options.provider === "fish") {
    try {
      await speakWithFishAudio(text, options);
      return;
    } catch (error) {
      options.onFallback?.(
        error instanceof Error ? error.message : "Fish Audio no respondio. Uso la voz del navegador.",
      );
    }
  }

  speakWithBrowser(text, options);
}

function speakWithBrowser(text: string, options: SpeakOptions) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    options.onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickSpanishVoice();

  if (voice) {
    utterance.voice = voice;
  }

  utterance.lang = voice?.lang ?? "es-MX";
  utterance.rate = 1.02;
  utterance.pitch = 0.9;

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

async function speakWithFishAudio(text: string, options: SpeakOptions) {
  const response = await fetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Fish Audio no esta configurado en el servidor.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  activeAudio = audio;

  audio.onplay = () => options.onStart?.();
  audio.onended = () => {
    URL.revokeObjectURL(url);
    activeAudio = null;
    options.onEnd?.();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    activeAudio = null;
    options.onEnd?.();
  };

  await audio.play();
}
