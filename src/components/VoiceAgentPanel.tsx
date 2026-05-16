"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic2, PhoneOff, Radio, Volume2 } from "lucide-react";
import { useState } from "react";

export function VoiceAgentPanel() {
  return (
    <ConversationProvider agentId="agent_01jypeb3njep7addtqsfjccekz">
      <VoiceAgentPanelContent />
    </ConversationProvider>
  );
}

function VoiceAgentPanelContent() {
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string>("Max listo para prueba interna.");

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
      setLastMessage("Max conectado. Sesion de voz activa.");
    },
    onDisconnect: () => {
      setLastMessage("Sesion terminada.");
    },
    onMessage: (message) => {
      setLastMessage(typeof message === "string" ? message : JSON.stringify(message));
    },
    onError: (event) => {
      setError(String(event || "Error en la conversacion de voz."));
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  async function startConversation() {
    setError(null);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch("/api/elevenlabs/conversation-token", {
        cache: "no-store",
      });

      const body = (await response.json()) as { token?: string; error?: string };

      if (!response.ok || !body.token) {
        throw new Error(body.error || "No se pudo obtener token de ElevenLabs.");
      }

      conversation.startSession({
        conversationToken: body.token,
        connectionType: "webrtc",
      });
    } catch (event) {
      setError(event instanceof Error ? event.message : "No se pudo iniciar Max.");
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
          Max · ElevenLabs
        </span>
      </div>

      <h3 className="text-xl font-black">Voice Agent</h3>
      <p className="mt-3 text-sm leading-6 text-[#b7b2a8]">
        Prueba interna por WebRTC. No hace llamadas reales ni usa Twilio; solo conversa desde el
        navegador con microfono autorizado.
      </p>

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
