import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { env } from "./env.js";

export function openAIClient() {
  const endpoint = env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = env.AZURE_OPENAI_API_VERSION;
  const deployment = env.AZURE_OPENAI_DEPLOYMENT;

  if (!env.AZURE_OPENAI_API_KEY) {
    const credential = new DefaultAzureCredential();
    const azureADTokenProvider = getBearerTokenProvider(
      credential,
      "https://cognitiveservices.azure.com/.default"
    );
    return new AzureOpenAI({
      endpoint,
      azureADTokenProvider,
      apiVersion,
      deployment,
    } as any);
  }

  return new AzureOpenAI({
    endpoint,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion,
    deployment,
  } as any);
}
