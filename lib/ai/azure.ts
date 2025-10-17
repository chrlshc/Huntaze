// Minimal Azure OpenAI chat helper
// Env required:
//   AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT (https://<resource>.openai.azure.com),
//   AZURE_OPENAI_DEPLOYMENT_NAME (chat deployment, e.g., gpt-4o-...)

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const apiKey = process.env.AZURE_OPENAI_API_KEY;
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const defaultDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const apiVersion = '2024-06-01';

function assertEnv() {
  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      'Missing Azure OpenAI env. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME.'
    );
  }
}

export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<{ text: string; raw: any }> {
  assertEnv();
  const d = defaultDeployment!;
  const url = `${endpoint!.replace(/\/$/, '')}/openai/deployments/${d}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey as string,
    },
    body: JSON.stringify({ messages, temperature: opts.temperature ?? 0.2 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Azure OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { text, raw: data };
}

export async function chatWith(
  messages: ChatMessage[],
  opts: { deployment?: string; temperature?: number } = {}
): Promise<{ text: string; raw: any }> {
  assertEnv();
  const dep = opts.deployment || defaultDeployment!;
  const url = `${endpoint!.replace(/\/$/, '')}/openai/deployments/${dep}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey as string,
    },
    body: JSON.stringify({ messages, temperature: opts.temperature ?? 0.2 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Azure OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { text, raw: data };
}
