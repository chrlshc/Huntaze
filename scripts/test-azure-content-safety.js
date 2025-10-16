#!/usr/bin/env node
/*
  Smoke test: Azure Content Safety (image)
  Requires env:
    AZURE_CONTENT_SAFETY_ENDPOINT
  Auth: Entra ID (DefaultAzureCredential)
  Usage:
    node scripts/test-azure-content-safety.js ./path/to/image.jpg
*/

import fs from 'node:fs';

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node scripts/test-azure-content-safety.js <imagePath>');
  process.exit(1);
}

try {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
  if (!endpoint) throw new Error('Set AZURE_CONTENT_SAFETY_ENDPOINT');

  const buf = fs.readFileSync(imagePath);
  if (buf.length > 4 * 1024 * 1024) {
    throw new Error('Image exceeds 4MB limit for Content Safety');
  }

  const { default: createClient, isUnexpected } = await import('@azure-rest/ai-content-safety');
  const { DefaultAzureCredential } = await import('@azure/identity');
  const client = createClient(endpoint, new DefaultAzureCredential());

  const res = await client.path('/image:analyze').post({ body: { image: { content: buf.toString('base64') } } });
  if (isUnexpected(res)) throw new Error(`Content Safety error: ${res.status}`);

  const cats = (res.body.categoriesAnalysis || []).map(c => ({ category: c.category, severity: c.severity }));
  console.log('\n[OK] Azure Content Safety categories:');
  console.table(cats);
} catch (err) {
  console.error('[FAIL] Azure Content Safety test:', err?.message || err);
  process.exit(1);
}

