"use client";

import {
  Activity,
  Diamond,
  History,
  ListChecks,
  Mic,
  MicOff,
  Minus,
  Send,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { CoreSphere, type CoreState } from "@/components/jarvis/CoreSphere";
import { Sparkline } from "@/components/jarvis/Sparkline";
import { respond, type BrainAction } from "@/lib/jarvis/brain";
import {
  directives,
  hudCards,
  hudIdentity,
  primaryDirective,
  statusChips,
  trail,
  vitals,
  type HudCard,
} from "@/lib/jarvis/hudData";
import {
  cancelSpeech,
  createRecognizer,
  isSpeechRecognitionSupported,
  speak,
  type Recognizer,
  type TtsProvider,
} from "@/lib/jarvis/voice";

type Role = "operator" | "javier";

type Message = {
  id: string;
  role: Role;
  text: string;
  time: string;
};

type PanelId = "vitals" | "directives" | "trail" | "core";

const cardPosition: Record<HudCard["anchor"], string> = {
  "top-left": "left-2 top-6 lg:left-6 lg:top-10",
  "top-right": "right-2 top-16 lg:right-4 lg:top-8",
  "bottom-right": "bottom-40 right-2 lg:bottom-44 lg:right-10",
};

function clockNow() {
  return new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const IDLE_CLOCK = "--:--:--";

/**
 * El reloj y la deteccion de cliente viven fuera de React para no sembrar
 * estado dentro de un efecto y para no romper la hidratacion.
 */
const clockStore = {
  value: IDLE_CLOCK,
  listeners: new Set<() => void>(),
  timer: 0,
};

function subscribeClock(listener: () => void) {
  clockStore.listeners.add(listener);

  if (clockStore.listeners.size === 1) {
    clockStore.value = clockNow();
    clockStore.timer = window.setInterval(() => {
      clockStore.value = clockNow();
      clockStore.listeners.forEach((notify) => notify());
    }, 1000);
  }

  return () => {
    clockStore.listeners.delete(listener);

    if (clockStore.listeners.size === 0) {
      window.clearInterval(clockStore.timer);
      clockStore.timer = 0;
    }
  };
}

const noopSubscribe = () => () => {};

function useClock() {
  return useSyncExternalStore(
    subscribeClock,
    () => clockStore.value,
    () => IDLE_CLOCK,
  );
}

function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const bootMessage: Message = {
  id: "boot",
  role: "javier",
  text: `${hudIdentity.code} en linea. Nucleo estable, enlace con Convex activo. Pide estado, prospectos, directivas o bitacora.`,
  time: "",
};

export function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([bootMessage]);
  const [interim, setInterim] = useState("");
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [coreState, setCoreState] = useState<CoreState>("idle");
  const [muted, setMuted] = useState(false);
  const [provider, setProvider] = useState<TtsProvider>("browser");
  const [notice, setNotice] = useState<string | null>(null);
  const [focused, setFocused] = useState<PanelId | null>(null);
  const [openCards, setOpenCards] = useState<string[]>(hudCards.map((card) => card.id));

  const recognizerRef = useRef<Recognizer | null>(null);
  const listeningRef = useRef(false);
  const resumeAfterSpeechRef = useRef(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const clock = useClock();
  const isClient = useIsClient();
  const supportsVoice = useMemo(() => isClient && isSpeechRecognitionSupported(), [isClient]);

  useEffect(() => {
    if (!focused) {
      return;
    }

    const timer = window.setTimeout(() => setFocused(null), 2600);
    return () => window.clearTimeout(timer);
  }, [focused]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, interim]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    setInterim("");
    recognizerRef.current?.stop();
  }, []);

  const applyAction = useCallback(
    (action: BrainAction) => {
      if (action.kind === "focus") {
        setFocused(action.panel);
        return;
      }

      if (action.kind === "clear") {
        setMessages([bootMessage]);
        setOpenCards(hudCards.map((card) => card.id));
        return;
      }

      if (action.kind === "mute") {
        setMuted(true);
        cancelSpeech();
      }
    },
    [],
  );

  const handleInput = useCallback(
    (rawText: string) => {
      const text = rawText.trim();

      if (!text) {
        return;
      }

      setInterim("");
      setMessages((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: "operator", text, time: clockNow() },
      ]);
      setCoreState("thinking");

      const reply = respond(text);

      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { id: `j-${Date.now()}`, role: "javier", text: reply.text, time: clockNow() },
        ]);
        applyAction(reply.action);

        const willMute = reply.action.kind === "mute";

        if (muted || willMute) {
          setCoreState(listeningRef.current ? "listening" : "idle");
          return;
        }

        resumeAfterSpeechRef.current = listeningRef.current;

        if (listeningRef.current) {
          recognizerRef.current?.stop();
        }

        void speak(reply.text, {
          provider,
          onStart: () => setCoreState("speaking"),
          onFallback: (reason) => setNotice(reason),
          onEnd: () => {
            setCoreState(resumeAfterSpeechRef.current ? "listening" : "idle");

            if (resumeAfterSpeechRef.current && listeningRef.current) {
              recognizerRef.current?.start();
            }
          },
        });
      }, 420);
    },
    [applyAction, muted, provider],
  );

  const startListening = useCallback(() => {
    setNotice(null);

    if (!recognizerRef.current) {
      recognizerRef.current = createRecognizer({
        onResult: (result) => {
          if (result.isFinal) {
            handleInput(result.transcript);
            return;
          }

          setInterim(result.transcript);
        },
        onError: (message) => {
          setNotice(message);
          listeningRef.current = false;
          setListening(false);
          setCoreState("idle");
        },
        onEnd: () => {
          if (listeningRef.current && resumeAfterSpeechRef.current === false) {
            recognizerRef.current?.start();
          }
        },
      });
    }

    if (!recognizerRef.current) {
      setNotice(
        "Este navegador no trae reconocimiento de voz. Abre el prototipo en Chrome o Edge, o escribe la orden abajo.",
      );
      return;
    }

    listeningRef.current = true;
    setListening(true);
    setCoreState("listening");
    recognizerRef.current.start();
  }, [handleInput]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      recognizerRef.current?.stop();
    };
  }, []);

  const progress = Math.min(100, (primaryDirective.value / primaryDirective.target) * 100);

  return (
    <div className="hud-root relative min-h-dvh overflow-hidden font-mono">
      <div className="hud-vignette pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] overflow-hidden">
        <div className="hud-floor absolute inset-x-[-40%] bottom-0 h-full" />
        <div className="hud-horizon absolute inset-x-0 top-0 h-px" />
      </div>
      <div className="hud-scan hud-sweep pointer-events-none absolute inset-0 overflow-hidden" />

      <div className="relative flex min-h-dvh flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hud-line)] px-4 py-3 lg:px-8">
          <div>
            <h1 className="hud-label hud-glow text-xl font-bold text-[var(--hud-cyan)] lg:text-2xl">
              {hudIdentity.code}
            </h1>
            <p className="hud-label mt-1 text-[9px] text-[var(--hud-dim)]">
              {hudIdentity.expansion}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {statusChips.map((chip) => (
              <span key={chip.id} className="hud-label flex items-center gap-2 text-[10px]">
                <span className="hud-live text-[var(--hud-cyan)]">◆</span>
                <span className="text-[var(--hud-dim)]">{chip.label}</span>
                <span className="text-[var(--hud-cyan)]">· {chip.value}</span>
              </span>
            ))}
            <span className="hud-label text-[10px] text-[var(--hud-dim)]" suppressHydrationWarning>
              {clock}
            </span>
            <button
              type="button"
              onClick={() => {
                setMessages([bootMessage]);
                setOpenCards(hudCards.map((card) => card.id));
                setNotice(null);
              }}
              className="hud-label hud-panel px-3 py-1.5 text-[10px] text-[var(--hud-dim)] transition hover:text-[var(--hud-cyan)]"
            >
              limpiar consola
            </button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:gap-5 lg:p-6">
          {/* Columna izquierda: vitales, directivas, bitacora */}
          <aside className="flex flex-col gap-4">
            <Panel
              title="Vitales del sistema"
              tag="pipeline.vox"
              icon={<Activity className="size-3.5" />}
              active={focused === "vitals"}
            >
              <div className="grid gap-3">
                {vitals.map((vital) => (
                  <div key={vital.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="hud-label text-[9px] text-[var(--hud-dim)]">
                        {vital.label}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-[var(--hud-cyan)]">
                        {vital.trend === "up" ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <Minus className="size-3" />
                        )}
                        {vital.delta}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <strong className="text-lg font-bold text-[#e6fffb]">{vital.value}</strong>
                      <Sparkline series={vital.series} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Directivas"
              tag="top-3"
              icon={<ListChecks className="size-3.5" />}
              active={focused === "directives"}
            >
              <ol className="grid gap-2.5">
                {directives.map((directive, index) => (
                  <li key={directive.id} className="flex gap-2 text-[11px] leading-5">
                    <span className="text-[var(--hud-cyan)]">{index + 1}</span>
                    <span className="flex-1 text-[#b9d5d1]">{directive.text}</span>
                    <span className="text-[var(--hud-dim)]">{directive.eta}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel
              title="Bitacora"
              tag="index.trail"
              icon={<History className="size-3.5" />}
              active={focused === "trail"}
            >
              <ul className="grid gap-2">
                {trail.map((event) => (
                  <li key={event.id} className="flex items-baseline gap-2 text-[11px]">
                    <span className="text-[var(--hud-dim)]">{event.time}</span>
                    <span className="flex-1 text-[#b9d5d1]">{event.label}</span>
                    <span className="hidden text-[9px] text-[var(--hud-dim)] xl:inline">
                      {event.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>

          {/* Centro: nucleo + directiva primaria */}
          <section className="relative flex min-h-[420px] flex-col">
            <div className="relative flex-1">
              <div className="absolute inset-0">
                <CoreSphere state={coreState} />
              </div>

              {hudCards
                .filter((card) => openCards.includes(card.id))
                .map((card) => (
                  <div
                    key={card.id}
                    className={`hud-card hud-panel absolute hidden w-52 items-start gap-2 px-3 py-2 md:flex ${cardPosition[card.anchor]}`}
                  >
                    <Diamond className="mt-0.5 size-3 shrink-0 text-[var(--hud-cyan)]" />
                    <div className="min-w-0 flex-1">
                      <p className="hud-label text-[9px] text-[#cfe9e6]">{card.title}</p>
                      <p className="truncate text-[10px] text-[var(--hud-dim)]">{card.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Cerrar ${card.title}`}
                      onClick={() => setOpenCards((ids) => ids.filter((id) => id !== card.id))}
                      className="text-[var(--hud-dim)] transition hover:text-[var(--hud-cyan)]"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}

              <p className="hud-label pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] text-[var(--hud-dim)]">
                {coreState === "listening"
                  ? "escuchando"
                  : coreState === "speaking"
                    ? "hablando"
                    : coreState === "thinking"
                      ? "procesando"
                      : ""}
              </p>
            </div>

            <div
              className={`hud-panel relative mt-4 px-5 py-4 text-center transition ${
                focused === "core" ? "ring-1 ring-[var(--hud-cyan)]" : ""
              }`}
            >
              <p className="hud-label text-[9px] text-[var(--hud-dim)]">{primaryDirective.label}</p>
              <p className="hud-glow mt-1 text-4xl font-bold tracking-[0.12em] text-[#e6fffb] lg:text-5xl">
                {primaryDirective.value}
                <span className="ml-2 align-middle text-[10px] tracking-[0.24em] text-[var(--hud-dim)]">
                  {primaryDirective.unit}
                </span>
              </p>
              <div className="mx-auto mt-3 h-px w-full max-w-md bg-[var(--hud-line)]">
                <div
                  className="h-px bg-[var(--hud-cyan)] shadow-[0_0_10px_rgba(53,212,199,0.9)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="hud-label mt-2 text-[9px] text-[var(--hud-dim)]">
                meta {primaryDirective.target} · esta semana {primaryDirective.weekly} · a este ritmo{" "}
                {primaryDirective.pace}
              </p>
              <p className="mt-1 text-[9px] text-[var(--hud-dim)]">{primaryDirective.footnote}</p>
            </div>
          </section>

          {/* Columna derecha: consola de voz */}
          <aside className="flex min-h-0 flex-col gap-4">
            <Panel
              title="Consola de voz"
              className="flex-1"
              tag={provider === "fish" ? "fish.audio" : "web.speech"}
              icon={<Mic className="size-3.5" />}
              bodyClassName="flex min-h-[280px] flex-1 flex-col"
            >
              <div
                ref={transcriptRef}
                className="hud-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
              >
                {messages.map((message) => (
                  <div key={message.id}>
                    <p className="hud-label text-[9px] text-[var(--hud-dim)]">
                      {message.role === "operator" ? hudIdentity.operator : hudIdentity.code}
                      {message.time ? ` · ${message.time}` : ""}
                    </p>
                    <p
                      className={`mt-1 text-[11px] leading-5 ${
                        message.role === "operator" ? "text-[#b9d5d1]" : "text-[#e6fffb]"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                ))}

                {interim ? (
                  <p className="text-[11px] italic leading-5 text-[var(--hud-dim)]">{interim}…</p>
                ) : null}
              </div>

              {notice ? (
                <p className="mt-3 border border-[#ff6b4a]/40 bg-[#ff6b4a]/10 p-2 text-[10px] leading-4 text-[#ffb19f]">
                  {notice}
                </p>
              ) : null}

              {isClient && !supportsVoice ? (
                <p className="mt-3 text-[10px] leading-4 text-[var(--hud-dim)]">
                  Este navegador no expone reconocimiento de voz. Escribe la orden abajo o abre el
                  prototipo en Chrome o Edge.
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  className={`hud-label flex h-10 items-center justify-center gap-2 border text-[10px] transition ${
                    listening
                      ? "border-[var(--hud-cyan)] bg-[var(--hud-cyan)]/15 text-[var(--hud-cyan)]"
                      : "border-[var(--hud-line)] text-[#cfe9e6] hover:border-[var(--hud-cyan)]"
                  }`}
                >
                  {listening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                  {listening ? "detener" : "hablar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMuted((value) => {
                      if (!value) {
                        cancelSpeech();
                        setCoreState(listeningRef.current ? "listening" : "idle");
                      }

                      return !value;
                    });
                  }}
                  className="hud-label flex h-10 items-center justify-center gap-2 border border-[var(--hud-line)] text-[10px] text-[#cfe9e6] transition hover:border-[var(--hud-cyan)]"
                >
                  {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                  {muted ? "voz off" : "voz on"}
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 border border-[var(--hud-line)] p-1">
                {(["browser", "fish"] as TtsProvider[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setProvider(option)}
                    className={`hud-label py-1.5 text-[9px] transition ${
                      provider === option
                        ? "bg-[var(--hud-cyan)]/15 text-[var(--hud-cyan)]"
                        : "text-[var(--hud-dim)] hover:text-[#cfe9e6]"
                    }`}
                  >
                    {option === "browser" ? "navegador" : "fish audio"}
                  </button>
                ))}
              </div>

              <form
                className="mt-3 flex items-center gap-2 border border-[var(--hud-line)] px-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleInput(draft);
                  setDraft("");
                }}
              >
                <span className="text-[10px] text-[var(--hud-cyan)]">&gt;</span>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="escribe una orden"
                  aria-label="Orden escrita para Javier"
                  className="h-10 flex-1 bg-transparent text-[11px] text-[#e6fffb] outline-none placeholder:text-[var(--hud-dim)]"
                />
                <button
                  type="submit"
                  aria-label="Enviar orden"
                  className="text-[var(--hud-dim)] transition hover:text-[var(--hud-cyan)]"
                >
                  <Send className="size-3.5" />
                </button>
              </form>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  tag,
  icon,
  active,
  className = "",
  bodyClassName,
  children,
}: {
  title: string;
  tag: string;
  icon: React.ReactNode;
  active?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`hud-panel relative flex flex-col p-4 transition ${className} ${
        active ? "ring-1 ring-[var(--hud-cyan)]" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--hud-line)] pb-2">
        <span className="hud-label flex items-center gap-2 text-[10px] text-[#cfe9e6]">
          <span className="text-[var(--hud-cyan)]">{icon}</span>
          {title}
        </span>
        <span className="hud-label text-[9px] text-[var(--hud-dim)]">{tag}</span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
