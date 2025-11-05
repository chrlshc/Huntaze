// OnlyFans Browser Worker - Playwright integration (with graceful fallback)
// Attempts to use Playwright at runtime; if unavailable, returns a clear error.

import type { OfMessage } from '@/lib/types/onlyfans';
import { sessionManager } from '@/lib/of/session-manager';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function loadChromium() {
  try {
    // Use indirection to avoid static resolution during bundling
    // eslint-disable-next-line no-new-func
    const dynImport: (m: string) => Promise<any> = new Function('m', 'return import(m)') as any;
    try {
      const core = await dynImport('playwright-core');
      if (core?.chromium) return core.chromium;
    } catch {}
    try {
      const full = await dynImport('playwright');
      if (full?.chromium) return full.chromium;
    } catch {}
    return null;
  } catch {
    return null;
  }
}

export async function sendOfMessage(
  userId: string,
  message: OfMessage,
): Promise<SendResult> {
  const chromium = await loadChromium();
  if (!chromium) {
    return { success: false, error: 'Playwright not installed in this environment' };
  }

  // Load browser cookies for OnlyFans session
  const cookies = await sessionManager.getBrowserCookies(userId);
  if (!cookies || !cookies.length) {
    return { success: false, error: 'No active OnlyFans session for this user' };
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });
  await context.addCookies(cookies as any);
  const page = await context.newPage();

  try {
    // Navigate to conversation (placeholder selector/URL)
    // In a real impl, map conversationId to OF thread URL
    await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'domcontentloaded' });
    // TODO: select the right conversation using message.conversationId
    // Type and send the message (selectors must be refined in real implementation)
    await page.waitForTimeout(500 + Math.random() * 1000);
    await page.fill('textarea', (message as any).content?.text ?? '');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(800 + Math.random() * 800);
    return { success: true, messageId: `of_${Date.now()}` };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send via browser worker' };
  } finally {
    await browser.close();
  }
}

export const browserWorkerPool = {
  closeAll: async () => {
    // No pooled instances in this inline implementation
  },
};
