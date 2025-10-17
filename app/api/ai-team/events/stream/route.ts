export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { bus } from "../../../../../src/lib/bus";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const keepAliveMs = 15000;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      const ka = setInterval(() => {
        controller.enqueue(encoder.encode(`:ka\n\n`));
      }, keepAliveMs);

      const unsubs: Array<() => Promise<void>> = [];
      unsubs.push(await bus.subscribe("POST_SCHEDULED", (d) => send("POST_SCHEDULED", d)));
      unsubs.push(await bus.subscribe("POST_FAILED", (d) => send("POST_FAILED", d)));
      unsubs.push(await bus.subscribe("PUBLISH_BATCH_DONE", (d) => send("PUBLISH_BATCH_DONE", d)));

      const onClose = async () => {
        clearInterval(ka);
        await Promise.all(unsubs.map((u) => u()));
        controller.close();
      };

      // Close on client abort
      (req as any).signal?.addEventListener?.("abort", onClose);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Content-Encoding": "none",
    },
  });
}

