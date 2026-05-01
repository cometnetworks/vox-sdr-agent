import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ ok: true, service: "vox-sdr-agent" }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

http.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const update = await request.json();

    return new Response(JSON.stringify({ ok: true, received: Boolean(update) }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;

