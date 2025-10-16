import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { containers } from "./clients/cosmos.js";
import { docSentiment } from "./clients/textAnalytics.js";

app.http("fan360_get", {
  methods: ["GET"],
  route: "fan360/{fan_id}",
  authLevel: "function",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const fanId = (req.params as any)["fan_id"] as string | undefined;
    if (!fanId) {
      return { status: 400, jsonBody: { error: "fan_id missing" } };
    }

    const windowDays = Number(req.query.get("window_days") ?? 30);
    const lang = req.query.get("lang") ?? "en";

    const profile = await containers.fans
      .item(fanId, fanId)
      .read<any>()
      .then((res) => res.resource)
      .catch(() => null);

    if (!profile) {
      return { status: 404, jsonBody: { error: "fan_not_found" } };
    }

    const tx = await containers.transactions.items
      .query({
        query: "SELECT TOP 10 c.type, c.amount, c.ts FROM c WHERE c.fan_id = @fan ORDER BY c.ts DESC",
        parameters: [{ name: "@fan", value: fanId }],
      })
      .fetchAll();

    const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const msgs = await containers.messages.items
      .query({
        query:
          "SELECT TOP 20 c.dir, c.text, c.ts FROM c WHERE c.fan_id = @fan AND c.ts >= @since ORDER BY c.ts DESC",
        parameters: [
          { name: "@fan", value: fanId },
          { name: "@since", value: sinceIso },
        ],
      })
      .fetchAll();

    const sentimentTexts = (msgs.resources ?? [])
      .map((m: any) => m.text)
      .filter((t: string) => !!t)
      .slice(0, 10);
    const sentiment = await docSentiment(lang, sentimentTexts);

    const segment = await containers.segments
      .item(fanId, fanId)
      .read<any>()
      .then((res) => res.resource)
      .catch(() => null);

    const payload = {
      fan_id: fanId,
      profile: {
        handle: profile?.handle,
        ltv_usd: profile?.ltv_usd ?? 0,
        segment_rfm: segment?.segment_rfm ?? null,
        vip: profile?.vip ?? false,
        joined_at: profile?.joined_at ?? null,
      },
      recent_purchases: (tx.resources ?? []).map((r: any) => ({
        type: r.type,
        amount: r.amount,
        ts: r.ts,
      })),
      history: {
        last_contacts: (msgs.resources ?? []).map((m: any) => ({
          dir: m.dir,
          snippet: (m.text ?? "").slice(0, 160),
          ts: m.ts,
        })),
        last_issue_types: profile?.last_issue_types ?? [],
      },
      sentiment: {
        overall: sentiment.overall,
        score: sentiment.score,
        window_days: windowDays,
      },
    };

    return { status: 200, jsonBody: payload };
  },
});
