#!/usr/bin/env node
console.log('[ai-summarizer] smoke start', new Date().toISOString());
console.log('ENV:', {
  REGION: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
  DB: !!process.env.DATABASE_URL,
  AZURE: !!process.env.AZURE_OPENAI_ENDPOINT,
});
setTimeout(() => {
  console.log('[ai-summarizer] smoke done');
  process.exit(0);
}, 500);
