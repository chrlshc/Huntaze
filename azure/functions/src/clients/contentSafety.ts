import ContentSafetyClient, { AnalyzeTextParameters, isUnexpected } from "@azure-rest/ai-content-safety";
import { AzureKeyCredential } from "@azure/core-auth";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "./env.js";

export async function analyzeTextSafety(text: string) {
  if (!env.CONTENT_SAFETY_ENDPOINT) {
    return { categoriesAnalysis: [] } as any;
  }
  const credential = env.CONTENT_SAFETY_KEY ? new AzureKeyCredential(env.CONTENT_SAFETY_KEY) : new DefaultAzureCredential();
  const client = ContentSafetyClient(env.CONTENT_SAFETY_ENDPOINT, credential as any);
  const params: AnalyzeTextParameters = { body: { text } };
  const res = await client.path("/text:analyze").post(params);
  if (isUnexpected(res)) {
    const message = (res as any).body?.error?.message ?? "Content Safety error";
    throw new Error(message);
  }
  return (res as any).body;
}
