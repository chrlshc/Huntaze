import { chromium, BrowserContext } from 'playwright';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const REGION = process.env.AWS_REGION || 'eu-west-3';
const TABLE_SESSIONS = process.env.OF_DDB_SESSIONS_TABLE!;
const TABLE_MESSAGES = process.env.OF_DDB_MESSAGES_TABLE!;
const TABLE_THREADS = process.env.OF_DDB_THREADS_TABLE!;
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID!;
const ACTION = process.env.ACTION || 'send'; // 'send' | 'inbox'
const USER_ID = process.env.USER_ID!;
const CONVERSATION_ID = process.env.CONVERSATION_ID;
const CONTENT_TEXT = process.env.CONTENT_TEXT;
const CREDS_SECRET_ID = process.env.OF_CREDS_SECRET_ID;
const OTP_CODE = process.env.OTP_CODE;

const ddb = new DynamoDBClient({ region: REGION });
const kms = new KMSClient({ region: REGION });
const sm = new SecretsManagerClient({ region: REGION });
const cw = new CloudWatchClient({ region: REGION });

const APP_ORIGIN = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '';
const WORKER_TOKEN = process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN || '';

async function reportState(userId: string, state: string, errorCode?: string) {
  try {
    if (!APP_ORIGIN || !WORKER_TOKEN) return;
    const url = new URL('/api/_internal/of/connect/report', APP_ORIGIN).toString();
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${WORKER_TOKEN}` },
      body: JSON.stringify({ userId, state, errorCode }),
    });
  } catch {}
}

async function getCookies(userId: string) {
  const res = await ddb.send(new GetItemCommand({ TableName: TABLE_SESSIONS, Key: { userId: { S: userId } } }));
  const b64 = res.Item?.cookiesCipherB64?.S;
  if (!b64) throw new Error('No cookies');
  const dec = await kms.send(new DecryptCommand({ CiphertextBlob: Buffer.from(b64, 'base64') }));
  const json = Buffer.from(dec.Plaintext as Uint8Array).toString('utf-8');
  return JSON.parse(json);
}

async function metric(name: string, value: number) {
  try {
    await cw.send(new PutMetricDataCommand({
      Namespace: 'Huntaze/OF',
      MetricData: [{ MetricName: name, Value: value, Unit: 'Count' }],
    }));
  } catch {}
}

async function getCreds(secretId: string): Promise<{ email: string; password: string }> {
  const out = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!out.SecretString) throw new Error('Secret empty');
  return JSON.parse(out.SecretString);
}

async function setRequiresAction(userId: string, flag: boolean) {
  await ddb.send(new PutItemCommand({
    TableName: TABLE_SESSIONS,
    Item: {
      userId: { S: userId },
      requiresAction: { BOOL: flag },
      updatedAt: { S: new Date().toISOString() },
    },
  }));
}

function stealthInit(context: BrowserContext) {
  return context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
}

async function run() {
  await reportState(USER_ID, 'LOGIN_STARTED');
  const cookies = await getCookies(USER_ID);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36'
  });
  await stealthInit(context);
  await context.addCookies(cookies as any);
  const page = await context.newPage();

  try {
    if (ACTION === 'login') {
      if (!CREDS_SECRET_ID) throw new Error('OF_CREDS_SECRET_ID missing');
      const { email, password } = await getCreds(CREDS_SECRET_ID);

      await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1200 + Math.random() * 800);

      const needsOtp = await page.locator('input[name="code"], input[autocomplete="one-time-code"]').count();
      if (needsOtp > 0 && !OTP_CODE) {
        await setRequiresAction(USER_ID, true);
        await metric('LoginRequiresAction', 1);
        await reportState(USER_ID, 'OTP_REQUIRED');
        throw new Error('OTP required');
      }
      if (needsOtp > 0 && OTP_CODE) {
        await page.fill('input[name="code"], input[autocomplete="one-time-code"]', OTP_CODE);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1200 + Math.random() * 800);
      }

      const cookies = await context.cookies();
      const onlyfansCookies = cookies.filter(c => (c.domain || '').includes('onlyfans.com'));
      const enc = await kms.send(new EncryptCommand({ KeyId: KMS_KEY_ID, Plaintext: Buffer.from(JSON.stringify(onlyfansCookies)) }));
      await ddb.send(new PutItemCommand({
        TableName: TABLE_SESSIONS,
        Item: {
          userId: { S: USER_ID },
          cookiesCipherB64: { S: Buffer.from(enc.CiphertextBlob as Uint8Array).toString('base64') },
          requiresAction: { BOOL: false },
          updatedAt: { S: new Date().toISOString() },
        },
      }));
      await metric('LoginSuccess', 1);
      await reportState(USER_ID, 'CONNECTED');
      return;
    }

    if (ACTION === 'inbox') {
      await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000 + Math.random() * 1000);
      const items = await page.evaluate(() => {
        const list = Array.from(document.querySelectorAll('[data-e2e="message-item"]')) as HTMLElement[];
        return list.slice(0, 50).map(el => ({
          id: el.getAttribute('data-id') || '',
          author: (el.querySelector('[data-e2e="author"]') as HTMLElement)?.innerText || '',
          text: (el.querySelector('[data-e2e="text"]') as HTMLElement)?.innerText || '',
          ts: Date.now()
        }));
      });
      console.log(JSON.stringify({ type: 'inbox', count: items.length }));
      await metric('InboxSyncSuccess', 1);
      return;
    }

    if (ACTION === 'send') {
      if (!CONVERSATION_ID || !CONTENT_TEXT) throw new Error('Missing CONVERSATION_ID or CONTENT_TEXT');
      await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(800 + Math.random() * 800);
      // TODO: cibler la conversation par CONVERSATION_ID
      await page.fill('textarea', CONTENT_TEXT);
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(800 + Math.random() * 800);

      await ddb.send(new PutItemCommand({
        TableName: TABLE_MESSAGES,
        Item: {
          id: { S: `of_${Date.now()}` },
          userId: { S: USER_ID },
          conversationId: { S: CONVERSATION_ID },
          status: { S: 'sent' },
          content: { S: CONTENT_TEXT },
          ts: { N: String(Date.now()) }
        }
      }));
      console.log(JSON.stringify({ type: 'send', ok: true }));
      await metric('MessagesSent', 1);
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
  metric('MessagesFailed', 1).catch(() => {});
  if (USER_ID) reportState(USER_ID, 'FAILED', e?.message || String(e)).catch(() => {});
  process.exitCode = 1;
});
