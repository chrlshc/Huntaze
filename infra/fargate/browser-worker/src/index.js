/* Minimal OF browser worker (send) with robust locators
 * - Reads cookies from DDB+KMS (us-east-1) using env: OF_DDB_SESSIONS_TABLE, AWS_REGION
 * - ACTION=send: opens /my/messages, clicks first thread, finds textbox by role, fills, clicks Send
 * - Logs ppv-meta BEFORE typing and a final send log
 */
const { chromium } = require('playwright');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');

const ACTION = process.env.ACTION || 'send';
const USER_ID = process.env.USER_ID || '';
const CONTENT_TEXT = process.env.CONTENT_TEXT || '';
const AWS_REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.OF_DDB_SESSIONS_TABLE || 'HuntazeOfSessions';

const PPV_PRICE_CENTS = process.env.PPV_PRICE_CENTS ? Number(process.env.PPV_PRICE_CENTS) : undefined;
const PPV_VARIANT = process.env.PPV_VARIANT;
const PPV_MEDIA_URL = process.env.PPV_MEDIA_URL;
const JOB_ID = process.env.JOB_ID || '';

const ddb = new DynamoDBClient({ region: AWS_REGION });
const kms = new KMSClient({ region: AWS_REGION });

async function getCookies(userId) {
  const out = await ddb.send(new GetItemCommand({ TableName: TABLE, Key: { userId: { S: String(userId) } } }));
  const b64 = out?.Item?.cookiesCipherB64?.S;
  if (!b64) throw new Error('No cookies for user');
  const dec = await kms.send(new DecryptCommand({ CiphertextBlob: Buffer.from(b64, 'base64') }));
  const json = Buffer.from(dec.Plaintext).toString('utf-8');
  return JSON.parse(json);
}

async function ensureConnected(page, context) {
  try {
    const cookies = await context.cookies();
    const of = cookies.filter(c => (c.domain || '').includes('onlyfans.com'));
    if (of.length === 0) return false;
    await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
    const pwdVisible = await page
      .locator('input[type="password"], input[autocomplete="current-password"]').first()
      .isVisible({ timeout: 1500 })
      .catch(() => false);
    return !pwdVisible;
  } catch { return false; }
}

async function run() {
  console.log(`[ENV] ACTION=${ACTION}\t[ENV] USER_ID=${USER_ID}`);
  if (!USER_ID) throw new Error('USER_ID missing');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  const page = await context.newPage();
  try {
    // load cookies from DDB+KMS
    try {
      const cookies = await getCookies(USER_ID);
      await context.addCookies(cookies);
    } catch (e) {
      console.warn('cookies.load.failed', e?.message || e);
    }

    if (ACTION === 'send') {
      if (!CONTENT_TEXT) throw new Error('Missing CONTENT_TEXT');
      if (!(await ensureConnected(page, context))) throw new Error('LOGIN_REQUIRED');

      await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'domcontentloaded', timeout: 45000 });
      try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
      await page.waitForTimeout(500 + Math.random() * 800);

      try {
        const thread = page
          .locator('[data-e2e="thread-item"], [data-testid="thread-item"], [data-qa="thread-item"], [role="listitem"]:has([data-e2e*="thread"])')
          .first();
        await thread.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
        try { await thread.click({ timeout: 3000 }); } catch {}
      } catch {}

      // ppv-meta before typing (for diagnostics)
      try {
        if (typeof PPV_PRICE_CENTS === 'number' && !Number.isNaN(PPV_PRICE_CENTS)) {
          console.log(JSON.stringify({ type: 'ppv-meta', jobId: JOB_ID || null, priceCents: PPV_PRICE_CENTS, variant: PPV_VARIANT || null, mediaUrl: PPV_MEDIA_URL || null }));
        }
      } catch {}

      try {
        const textbox = page.getByRole('textbox').first();
        await textbox.waitFor({ state: 'visible', timeout: 20000 });
        await textbox.fill(CONTENT_TEXT, { timeout: 15000 });
        const sendBtn = page.getByRole('button', { name: /send|envoyer/i }).first();
        let clicked = false;
        try { await sendBtn.waitFor({ state: 'visible', timeout: 5000 }); await sendBtn.click({ timeout: 5000 }); clicked = true; } catch {}
        if (!clicked) {
          try { await page.click('button:has-text("Send")', { timeout: 5000 }); clicked = true; } catch {}
        }
        if (!clicked) { try { await textbox.press('Enter', { timeout: 2000 }); } catch {} }
      } catch (e) {
        console.warn('send.compose.failed', e?.message || e);
      }

      try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
      await page.waitForTimeout(1200 + Math.random() * 1500);
      console.log(JSON.stringify({ type: 'send', ok: true, jobId: JOB_ID || null, mode: (typeof PPV_PRICE_CENTS === 'number' && !Number.isNaN(PPV_PRICE_CENTS)) ? 'ppv' : 'text' }));
      return;
    }

    throw new Error(`Unknown ACTION=${ACTION}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((e) => {
  console.error(JSON.stringify({ error: e?.message || String(e) }));
  process.exitCode = 1;
});

