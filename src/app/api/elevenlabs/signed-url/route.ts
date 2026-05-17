import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_AGENT_ID = "agent_01jypeb3njep7addtqsfjccekz";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID || DEFAULT_AGENT_ID;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY server environment variable." },
      { status: 500 },
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    {
      headers: {
        "xi-api-key": apiKey,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "ElevenLabs signed URL request failed." },
      { status: response.status },
    );
  }

  const body = (await response.json()) as { signed_url?: string };

  if (!body.signed_url) {
    return NextResponse.json(
      { error: "ElevenLabs did not return a signed URL." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    signedUrl: body.signed_url,
    agentId,
  });
}
