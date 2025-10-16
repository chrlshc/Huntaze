import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "./env.js";

export async function docSentiment(lang: string, texts: string[]) {
  if (!texts.length) {
    return { overall: "neutral", score: 0 } as const;
  }

  const docs = texts.map((text, idx) => ({
    id: String(idx + 1),
    language: lang || "en",
    text,
  }));

  if (!env.TEXT_ANALYTICS_ENDPOINT) {
    return { overall: "neutral", score: 0 } as const;
  }
  const credential = env.TEXT_ANALYTICS_KEY ? new AzureKeyCredential(env.TEXT_ANALYTICS_KEY) : new DefaultAzureCredential();
  const client = new TextAnalyticsClient(env.TEXT_ANALYTICS_ENDPOINT, credential as any);
  const result = await client.analyzeSentiment(docs);

  let aggregate = 0;
  let count = 0;
  for (const doc of result) {
    if (doc.error) continue;
    aggregate += doc.confidenceScores.positive - doc.confidenceScores.negative;
    count += 1;
  }

  if (!count) {
    return { overall: "neutral", score: 0 } as const;
  }

  const score = aggregate / count;
  const overall = score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral";

  return { overall, score } as const;
}
