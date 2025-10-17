import { getAzureOpenAI, getDefaultAzureDeployment } from '@/lib/ai/azure-openai';

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

export async function callOpenAI(opts: {
  model?: string;
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
}) {
  const deployment =
    opts.model ||
    process.env.AZURE_OPENAI_CHAT_DEPLOYMENT ||
    getDefaultAzureDeployment();

  const client = await getAzureOpenAI();

  const completion = await client.chat.completions.create({
    model: deployment,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens,
    stream: false,
    ...(opts.abortSignal ? { signal: opts.abortSignal } : {}),
  });

  const choice = completion.choices?.[0]?.message?.content ?? '';
  const usage = completion.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  return {
    content: choice,
    usage: {
      input: usage.prompt_tokens ?? 0,
      output: usage.completion_tokens ?? 0,
      total: usage.total_tokens ?? 0,
    },
  };
}
