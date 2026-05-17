"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic2, PhoneOff, Radio, Volume2 } from "lucide-react";
import { useState } from "react";

type VoiceConnectionMode = "websocket" | "webrtc";

export function VoiceAgentPanel() {
  return (
    <ConversationProvider agentId="agent_01jypeb3njep7addtqsfjccekz">
      <VoiceAgentPanelContent />
    </ConversationProvider>
  );
}

function VoiceAgentPanelContent() {
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string>("Javier listo para prueba interna.");
  const [connectionMode, setConnectionMode] = useState<VoiceConnectionMode>("websocket");
  const [contextStatus, setContextStatus] = useState<string>("Contexto pendiente");

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
      setLastMessage("Javier conectado. Sesion de voz activa.");
    },
    onDisconnect: () => {
      setLastMessage("Sesion terminada.");
    },
    onMessage: (message) => {
      setLastMessage(typeof message === "string" ? message : JSON.stringify(message));
    },
    onError: (event) => {
      setError(getVoiceErrorMessage(event));
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  async function startConversation() {
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Este navegador no permite acceso al microfono. Abre el dashboard en Chrome o Safari.",
        );
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });

      if (connectionMode === "websocket") {
        const response = await fetch("/api/elevenlabs/signed-url", {
          cache: "no-store",
        });
        const body = (await response.json()) as { signedUrl?: string; error?: string };

        if (!response.ok || !body.signedUrl) {
          throw new Error(body.error || "No se pudo obtener signed URL de ElevenLabs.");
        }

        await conversation.startSession({
          signedUrl: body.signedUrl,
          connectionType: "websocket",
        });
      } else {
        const response = await fetch("/api/elevenlabs/conversation-token", {
          cache: "no-store",
        });
        const body = (await response.json()) as { token?: string; error?: string };

        if (!response.ok || !body.token) {
          throw new Error(body.error || "No se pudo obtener token de ElevenLabs.");
        }

        await conversation.startSession({
          conversationToken: body.token,
          connectionType: "webrtc",
        });
      }

      await syncAgentContext();
    } catch (event) {
      setError(getVoiceErrorMessage(event));
    }
  }

  async function syncAgentContext() {
    try {
      setContextStatus("Sincronizando contexto");
      const response = await fetch("/api/agent/context", { cache: "no-store" });
      const body = (await response.json()) as { text?: string; error?: string };

      if (!response.ok || !body.text) {
        throw new Error(body.error || "No se pudo obtener contexto del agente.");
      }

      conversation.sendContextualUpdate(body.text);
      setContextStatus("Contexto sincronizado");
    } catch (event) {
      setContextStatus("Contexto no sincronizado");
      setError(getVoiceErrorMessage(event));
    }
  }

  async function stopConversation() {
    await conversation.endSession();
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#11151a] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#35d4c7]/10 text-[#35d4c7]">
          <Mic2 className="size-5" />
        </div>
        <span className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#d7ff46]">
          Javier · ElevenLabs
        </span>
      </div>

      <h3 className="text-xl font-black">Voice Agent</h3>
      <p className="mt-3 text-sm leading-6 text-[#b7b2a8]">
        Prueba interna desde el navegador con microfono autorizado. No hace llamadas reales ni usa
        Twilio.
      </p>

      <div className="mt-4 grid grid-cols-2 rounded-lg border border-white/10 bg-black/20 p-1 text-xs font-black">
        <button
          className={`rounded-md px-3 py-2 ${
            connectionMode === "websocket"
              ? "bg-[#d7ff46] text-[#0d0f12]"
              : "text-[#b7b2a8] hover:text-[#f7f3ea]"
          }`}
          type="button"
          onClick={() => setConnectionMode("websocket")}
          disabled={isConnected || isConnecting}
        >
          WebSocket
        </button>
        <button
          className={`rounded-md px-3 py-2 ${
            connectionMode === "webrtc"
              ? "bg-[#d7ff46] text-[#0d0f12]"
              : "text-[#b7b2a8] hover:text-[#f7f3ea]"
          }`}
          type="button"
          onClick={() => setConnectionMode("webrtc")}
          disabled={isConnected || isConnecting}
        >
          WebRTC
        </button>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#b7b2a8]">Estado</span>
          <strong className="text-[#f7f3ea]">{conversation.status}</strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[#b7b2a8]">
            <Volume2 className="size-4" />
            Modo
          </span>
          <strong className={conversation.isSpeaking ? "text-[#d7ff46]" : "text-[#35d4c7]"}>
            {conversation.isSpeaking ? "hablando" : "escuchando"}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#b7b2a8]">Conexion</span>
          <strong className="text-[#f7f3ea]">
            {connectionMode === "websocket" ? "WebSocket" : "WebRTC"}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#b7b2a8]">Memoria</span>
          <strong className="text-[#f7f3ea]">{contextStatus}</strong>
        </div>
      </div>

      <p className="mt-4 min-h-12 text-sm leading-6 text-[#b7b2a8]">{lastMessage}</p>

      {error ? (
        <p className="mt-3 rounded-lg border border-[#ff6b4a]/40 bg-[#ff6b4a]/10 p-3 text-sm text-[#ffb19f]">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex gap-3">
        <button
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#d7ff46] px-4 text-sm font-black text-[#0d0f12] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={startConversation}
          disabled={isConnected || isConnecting}
        >
          <Radio className="size-4" />
          {isConnecting ? "Conectando" : "Iniciar"}
        </button>
        <button
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-[#f7f3ea] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={stopConversation}
          disabled={!isConnected}
        >
          <PhoneOff className="size-4" />
          Detener
        </button>
      </div>
    </div>
  );
}

function getVoiceErrorMessage(event: unknown) {
  if (!(event instanceof Error)) {
    return "No se pudo iniciar Javier.";
  }

  if (event.name === "NotAllowedError" || /permission denied/i.test(event.message)) {
    return "El microfono esta bloqueado para este navegador. Autoriza el microfono para Codex/Chrome en macOS y vuelve a intentar. Si estas en el navegador interno de Codex, tambien puedes abrir http://localhost:3000 en Chrome para la prueba de voz.";
  }

  if (event.name === "NotFoundError" || /requested device not found/i.test(event.message)) {
    return "No encontre un microfono disponible. Conecta o activa un microfono y vuelve a intentar.";
  }

  if (/negotiation timed out/i.test(event.message)) {
    return "WebRTC no pudo negociar la llamada a tiempo. Cambia el modo a WebSocket y vuelve a iniciar; para produccion dejamos WebRTC cuando lo probemos en Chrome con red estable.";
  }

  return event.message || "No se pudo iniciar Javier.";
}
