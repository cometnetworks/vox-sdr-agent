import fs from "node:fs";

const apply = process.argv.includes("--apply");
const keepCurrentVoice = process.argv.includes("--keep-current-voice");
const promptOnly = process.argv.includes("--prompt-only");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
    }),
);

const agentId = env.ELEVENLABS_AGENT_ID || "agent_01jypeb3njep7addtqsfjccekz";
const prompt = fs
  .readFileSync("docs/JAVIER_REUS_AGENT_PROMPT.md", "utf8")
  .replace(/^# Javier Reus - Vox SDR IA Voice Prompt\s*/u, "")
  .trim();

if (!env.ELEVENLABS_API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env.local");
  process.exit(1);
}

const getResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
  headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
});

if (!getResponse.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        step: "get_agent",
        status: getResponse.status,
        message: "Could not read ElevenLabs agent. Check API key workspace/access.",
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const current = await getResponse.json();
const currentConversationConfig = current.conversation_config || {};
const currentAgent = currentConversationConfig.agent || {};
const currentTts = currentConversationConfig.tts || {};
const currentConversation = currentConversationConfig.conversation || {};
const currentTurn = currentConversationConfig.turn || {};
const preferredVoiceId = env.ELEVENLABS_VOICE_ID || "w7IU2bIH6xHcyfkUUWi3";
const voiceId = keepCurrentVoice ? currentTts.voice_id : preferredVoiceId;

const nextAgent = {
  ...currentAgent,
  first_message:
    "Miguel, soy Javier. Ya estoy conectado. Puedo revisar cuentas Hot, preparar mensajes o ayudarte a decidir a quien conviene contactar primero.",
  language: "es",
  disable_first_message_interruptions: false,
};

if (currentAgent.prompt && typeof currentAgent.prompt === "object") {
  nextAgent.prompt = { ...currentAgent.prompt };
  if ("prompt" in nextAgent.prompt) {
    nextAgent.prompt.prompt = prompt;
  } else if ("text" in nextAgent.prompt) {
    nextAgent.prompt.text = prompt;
  } else {
    nextAgent.prompt.prompt = prompt;
  }
} else {
  nextAgent.prompt = { prompt };
}

const body = {
  name: "Javier Reus",
  tags: ["vox", "sdr", "latam", "sales"],
  version_description: "Javier Reus Vox SDR prompt, shorter spoken style, more natural Spanish voice settings.",
  conversation_config: {
    ...currentConversationConfig,
    agent: nextAgent,
    conversation: {
      ...currentConversation,
      max_duration_seconds: currentConversation.max_duration_seconds || 600,
    },
    turn: {
      ...currentTurn,
      turn_timeout: 8,
      turn_eagerness: currentTurn.turn_eagerness || "normal",
      soft_timeout_config: {
        ...(currentTurn.soft_timeout_config || {}),
        timeout_seconds: -1,
        message: "Dame un segundo, lo estoy revisando.",
        use_llm_generated_message: false,
      },
    },
    tts: promptOnly
      ? currentTts
      : {
          ...currentTts,
          model_id: "eleven_v3_conversational",
          voice_id: voiceId,
          expressive_mode: true,
          agent_output_audio_format: "pcm_24000",
          optimize_streaming_latency: 2,
          stability: 0.38,
          similarity_boost: 0.82,
          speed: 0.96,
          text_normalisation_type: "system_prompt",
        },
  },
};

if (!apply) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        agentId,
        currentName: current.name,
        nextName: body.name,
        firstMessage: body.conversation_config.agent.first_message,
        language: body.conversation_config.agent.language,
        ttsModel: body.conversation_config.tts.model_id,
        voiceId: body.conversation_config.tts.voice_id,
        promptOnly,
        note: "Run `node scripts/sync-elevenlabs-max.mjs --apply` to patch the agent. Add --prompt-only to preserve all current voice settings.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const patchResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
  method: "PATCH",
  headers: {
    "content-type": "application/json",
    "xi-api-key": env.ELEVENLABS_API_KEY,
  },
  body: JSON.stringify(body),
});

let patchBody = {};
try {
  patchBody = await patchResponse.json();
} catch {}

console.log(
  JSON.stringify(
    {
      ok: patchResponse.ok,
      status: patchResponse.status,
      agentId,
      name: patchBody.name,
      versionId: patchBody.version_id,
    },
    null,
    2,
  ),
);

if (!patchResponse.ok) {
  process.exit(1);
}
