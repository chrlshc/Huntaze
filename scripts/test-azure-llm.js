#!/usr/bin/env node
/*
  Smoke test: Azure OpenAI (openai v4 + AzureOpenAI)
  Requires env:
    AZURE_OPENAI_ENDPOINT
    AZURE_OPENAI_DEPLOYMENT
    (optional) AZURE_OPENAI_API_VERSION
  Auth:
    Preferred: Entra ID via DefaultAzureCredential (RBAC on AOAI)
    Fallback:  AZURE_OPENAI_API_KEY
*/

(async () => {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';
    if (!endpoint || !deployment) throw new Error('Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT');

    const { AzureOpenAI } = await import('openai');
    let client;
    try {
      const { DefaultAzureCredential, getBearerTokenProvider } = await import('@azure/identity');
      const credential = new DefaultAzureCredential();
      const azureADTokenProvider = getBearerTokenProvider(credential, 'https://cognitiveservices.azure.com/.default');
      client = new AzureOpenAI({ endpoint, apiVersion, deployment, azureADTokenProvider });
    } catch (e) {
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      if (!apiKey) throw e;
      client = new AzureOpenAI({ endpoint, apiVersion, deployment, apiKey });
    }

    const resp = await client.chat.completions.create({
      model: deployment,
      messages: [{ role: 'user', content: 'Dis “Bonjour le monde” en une phrase.' }],
      max_tokens: 64,
      temperature: 0.3,
    });

    const text = resp?.choices?.[0]?.message?.content || '';
    console.log('\n[OK] Azure OpenAI response:\n', text.trim());
  } catch (err) {
    console.error('[FAIL] Azure OpenAI test:', err?.message || err);
    process.exit(1);
  }
})();

