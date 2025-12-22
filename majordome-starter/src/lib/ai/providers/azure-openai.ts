// Azure OpenAI client (OpenAI JS SDK) — singleton.
//
// AzureOpenAI is provided by the `openai` package.
// This client is configured WITHOUT a fixed deployment so you can choose
// per-call using the `model` parameter (set it to your *deployment name*).
//
// Env expected:
//   AZURE_OPENAI_ENDPOINT="https://<resource>.openai.azure.com"
//   AZURE_OPENAI_API_KEY="..."
//   AZURE_OPENAI_API_VERSION="2024-10-21" (or the version you use)
//
// You will still set `model: "<YOUR_DEPLOYMENT_NAME>"` on each request.

import { AzureOpenAI } from "openai";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const azureClient = new AzureOpenAI({
  endpoint: required("AZURE_OPENAI_ENDPOINT"),
  apiKey: required("AZURE_OPENAI_API_KEY"),
  apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? required("AZURE_OPENAI_API_VERSION"),
});
