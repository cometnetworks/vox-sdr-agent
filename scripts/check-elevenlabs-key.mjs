import fs from "node:fs";

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

if (!env.ELEVENLABS_API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env.local");
  process.exit(1);
}

const tokenResponse = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
  { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } },
);

let tokenBody = {};
try {
  tokenBody = await tokenResponse.json();
} catch {}

const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
  headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
});

let agentBody = {};
try {
  agentBody = await agentResponse.json();
} catch {}

console.log(
  JSON.stringify(
    {
      agentId,
      tokenEndpointOk: tokenResponse.ok,
      tokenStatus: tokenResponse.status,
      hasToken: Boolean(tokenBody.token),
      getAgentOk: agentResponse.ok,
      getAgentStatus: agentResponse.status,
      agentName: agentBody.name,
    },
    null,
    2,
  ),
);

if (!tokenResponse.ok || !agentResponse.ok) {
  process.exit(1);
}

