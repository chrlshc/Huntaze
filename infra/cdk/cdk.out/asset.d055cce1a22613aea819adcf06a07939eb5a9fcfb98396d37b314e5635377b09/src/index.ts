import { chromium, BrowserContext } from 'playwright';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

const REGION = process.env.AWS_REGION || 'eu-west-3';
const TABLE_SESSIONS = process.env.OF_DDB_SESSIONS_TABLE!;
const TABLE_MESSAGES = process.env.OF_DDB_MESSAGES_TABLE!;
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID!;
const ACTION = process.env.ACTION || 'send'; // 'send' | 'inbox'
const USER_ID = process.env.USER_ID!;
const CONVERSATION_ID = process.env.CONVERSATION_ID;
const CONTENT_TEXT = process.env.CONTENT_TEXT;

const ddb = new DynamoDBClient({ region: REGION });
const kms = new KMSClient({ region: REGION });

async function getCookies(userId: string) {
  const res = await ddb.send(new GetItemCommand({ TableName: TABLE_SESSIONS, Key: { userId: { S: userId } } }));
  const b64 = res.Item?.cookiesCipherB64?.S;
  if (!b64) throw new Error('No cookies');
  const dec = await kms.send(new DecryptCommand({ CiphertextBlob: Buffer.from(b64, 'base64') }));
  const json = Buffer.from(dec.Plaintext as Uint8Array).toString('utf-8');
  return JSON.parse(json);
}

function stealthInit(context: BrowserContext) {
  return context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
}

async function run() {
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

