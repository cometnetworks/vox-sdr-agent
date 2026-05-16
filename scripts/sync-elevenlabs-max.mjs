import fs from "node:fs";

const apply = process.argv.includes("--apply");

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
  .readFileSync("docs/MAX_AGENT_VOX_PROMPT.md", "utf8")
  .replace(/^# Max - Vox SDR IA Voice Prompt\s*/u, "")
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

const nextAgent = {
  ...currentAgent,
  first_message:
    "Hola, soy Max, el SDR IA de Vox. Estoy listo para revisar prospectos, priorizar cuentas y preparar oportunidades, sin enviar nada ni hacer llamadas reales sin tu aprobacion.",
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
  name: "Max - Vox SDR IA",
  tags: ["vox", "sdr", "latam", "sales"],
  version_description: "Vox SDR IA prompt, Spanish language, low-latency voice settings.",
  conversation_config: {
    ...currentConversationConfig,
    agent: nextAgent,
    conversation: {
      ...currentConversation,
      max_duration_seconds: currentConversation.max_duration_seconds || 600,
    },
    turn: {
      ...currentTurn,
      turn_timeout: currentTurn.turn_timeout || 7,
      turn_eagerness: currentTurn.turn_eagerness || "normal",
    },
    tts: {
      ...currentTts,
      model_id: currentTts.model_id || "eleven_flash_v2_5",
      agent_output_audio_format: currentTts.agent_output_audio_format || "pcm_16000",
      optimize_streaming_latency: currentTts.optimize_streaming_latency ?? 3,
      stability: currentTts.stability ?? 0.48,
      similarity_boost: currentTts.similarity_boost ?? 0.8,
      speed: currentTts.speed ?? 1.03,
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
        note: "Run `node scripts/sync-elevenlabs-max.mjs --apply` to patch the agent.",
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

