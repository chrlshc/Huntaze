import { chromium, BrowserContext, errors } from 'playwright';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { createBreaker } from './circuit';

const REGION = process.env.AWS_REGION || 'eu-west-3';
const TABLE_SESSIONS = process.env.OF_DDB_SESSIONS_TABLE!;
const TABLE_MESSAGES = process.env.OF_DDB_MESSAGES_TABLE!;
const TABLE_THREADS = process.env.OF_DDB_THREADS_TABLE!;
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID!;
const ACTION = process.env.ACTION || 'login'; // 'login' | 'send' | 'inbox'
const USER_ID = process.env.USER_ID!;
const JOB_ID = process.env.JOB_ID || '';
const CONVERSATION_ID = process.env.CONVERSATION_ID;
const CONTENT_TEXT = process.env.CONTENT_TEXT;
// Optional PPV fields (when provided by dispatcher)
const PPV_PRICE_CENTS = process.env.PPV_PRICE_CENTS ? Number(process.env.PPV_PRICE_CENTS) : undefined;
const PPV_CAPTION = process.env.PPV_CAPTION;
const PPV_MEDIA_URL = process.env.PPV_MEDIA_URL;
const PPV_VARIANT = process.env.PPV_VARIANT as ('A'|'B'|'C'|undefined);
const CREDS_SECRET_ID = process.env.OF_CREDS_SECRET_ID;
const OTP_CODE = process.env.OTP_CODE;

const ddb = new DynamoDBClient({ region: REGION });
const kms = new KMSClient({ region: REGION });
const sm = new SecretsManagerClient({ region: REGION });
const cw = new CloudWatchClient({ region: REGION });

const APP_ORIGIN = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '';
const WORKER_TOKEN = process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN || '';
const TRACE_S3_BUCKET = process.env.TRACE_S3_BUCKET;
const TRACE_S3_PREFIX = process.env.TRACE_S3_PREFIX || 'playwright-traces/';
const TRACE_KMS_KEY = process.env.TRACE_KMS_KEY;
const s3 = new S3Client({ region: REGION });

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

async function clickIfVisible(loc: any, timeout = 2000) {
  try { await loc.first().click({ timeout }); } catch {}
}

async function firstVisible(scope: any, candidates: (string | any)[], timeout = 10000) {
  const start = Date.now();
  for (const c of candidates) {
    const loc = typeof c === 'string' ? scope.locator(c) : c;
    const remain = Math.max(500, timeout - (Date.now() - start));
    try {
      await loc.first().waitFor({ state: 'visible', timeout: remain });
      return loc.first();
    } catch {}
  }
  throw new Error('No visible candidate found within timeout');
}

// Prefer action-based auto-waiting instead of manual visibility waits.
async function fillOneOf(scope: any, candidates: (string | any)[], value: string, perCandidateTimeout = 8000) {
  for (const c of candidates) {
    const loc = typeof c === 'string' ? scope.locator(c) : c;
    try {
      await loc.first().fill(value, { timeout: perCandidateTimeout });
      return loc.first();
    } catch (e: any) {
      if (!(e instanceof (errors as any).TimeoutError)) throw e;
    }
  }
  throw new Error('No candidate could be filled within timeout');
}

async function scopeForLogin(page: any) {
  // Handle common interstitials
  await page.locator('text=/Just a moment|Checking your browser|Security check/i').waitFor({ state: 'detached', timeout: 45000 }).catch(() => {});
  // Open login flow if needed
  await page.getByRole('button', { name: /log in|sign in/i }).or(page.getByText(/log in|sign in/i)).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForURL(/login|auth/i, { timeout: 15000 }).catch(() => {});
  // Fallback: if SPA didn't navigate, go directly to /login
  try {
    const u = page.url();
    if (!/login|auth/i.test(u)) {
      await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
    }
  } catch {}
  // Switch to email-based flow if present
  await clickIfVisible(page.getByText(/use email/i));
  // Probe possible login iframes
  const frameSelectors = [
    'iframe[src*="login" i]',
    'iframe[src*="auth" i]',
    'iframe[title*="log in" i]',
    'iframe[title*="sign in" i]'
  ];
  for (const sel of frameSelectors) {
    try {
      if (await page.locator(sel).count()) return page.frameLocator(sel).first();
    } catch {}
  }
  return page;
}

async function ensureEmailMode(page: any, scope: any) {
  // Try multiple variants that surfaces the email/password form
  const clicks = [
    page.getByRole('button', { name: /use email|continue with email|sign in with email|log in with email|use email instead/i }),
    page.getByText(/use email|continue with email|sign in with email|log in with email|use email instead/i),
    scope.getByRole('button', { name: /use email|continue with email|sign in with email|log in with email|use email instead/i }),
    scope.getByText(/use email|continue with email|sign in with email|log in with email|use email instead/i),
    page.getByRole('button', { name: /continue/i }),
    scope.getByRole('button', { name: /continue/i }),
  ];
  let clicked = false;
  for (const c of clicks) {
    try { await c.first().click({ timeout: 1500 }); clicked = true; break; } catch {}
  }
  if (clicked) {
    // After switching mode, re-evaluate scope (iframe might appear)
    try { await page.waitForTimeout(300); } catch {}
  }
  // Re-scope after potential UI changes
  try {
    // Prefer a dialog if visible
    const dlg = page.locator('dialog, [role="dialog"]').first();
    if (await dlg.count().catch(() => 0)) return dlg;
    return await scopeForLogin(page);
  } catch { return scope; }
}

// Circuit breakers per client + emit state-change metrics (fire-and-forget)
const emitBreakerStateMetric = (client: string) => (state: 'open'|'half-open'|'closed') => {
  try {
    const data = [
      { MetricName: 'CircuitStateChange', Value: 1, Unit: 'Count' as const, Dimensions: [{ Name: 'Client', Value: client }, { Name: 'State', Value: state }] },
      ...(state === 'open' ? [{ MetricName: 'CircuitOpenedCount', Value: 1, Unit: 'Count' as const, Dimensions: [{ Name: 'Client', Value: client }]}] : []),
      ...(state === 'half-open' ? [{ MetricName: 'CircuitHalfOpenCount', Value: 1, Unit: 'Count' as const, Dimensions: [{ Name: 'Client', Value: client }]}] : []),
      ...(state === 'closed' ? [{ MetricName: 'CircuitClosedCount', Value: 1, Unit: 'Count' as const, Dimensions: [{ Name: 'Client', Value: client }]}] : []),
    ];
    cw.send(new PutMetricDataCommand({ Namespace: 'Huntaze/OFWorker', MetricData: data as any }));
  } catch {}
};
const brS3 = createBreaker('s3', 5, 30000, emitBreakerStateMetric('s3'));
const brCW = createBreaker('cloudwatch', 5, 30000, emitBreakerStateMetric('cloudwatch'));
const brDDB = createBreaker('dynamodb', 5, 30000, emitBreakerStateMetric('dynamodb'));
const brKMS = createBreaker('kms', 5, 30000, emitBreakerStateMetric('kms'));
const brSM = createBreaker('secretsmanager', 5, 30000, emitBreakerStateMetric('secretsmanager'));

async function uploadTraceArtifacts(jobId: string, page: any, videoPath?: string) {
  if (!TRACE_S3_BUCKET) return null;
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const keyZip = `${TRACE_S3_PREFIX}${jobId}/${now}/trace.zip`;
  const keyPng = `${TRACE_S3_PREFIX}${jobId}/${now}/last.png`;
  const keyMp4 = `${TRACE_S3_PREFIX}${jobId}/${now}/page.mp4`;
  try {
    // Take screenshot before closing
    const png = await page.screenshot({ fullPage: false }).catch(() => null);
    if (png) {
      await brS3.exec(() => s3.send(new PutObjectCommand({
        Bucket: TRACE_S3_BUCKET,
        Key: keyPng,
        Body: png,
        ContentType: 'image/png',
        ...(TRACE_KMS_KEY ? { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: TRACE_KMS_KEY } : {})
      })));
    }
  } catch {}
  try {
    const buf = await fs.readFile('/tmp/trace.zip');
    await brS3.exec(() => s3.send(new PutObjectCommand({
      Bucket: TRACE_S3_BUCKET,
      Key: keyZip,
      Body: buf,
      ContentType: 'application/zip',
      ...(TRACE_KMS_KEY ? { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: TRACE_KMS_KEY } : {})
    })));
  } catch {}
  try {
    if (videoPath) {
      const vbuf = await fs.readFile(videoPath);
      await brS3.exec(() => s3.send(new PutObjectCommand({
        Bucket: TRACE_S3_BUCKET,
        Key: keyMp4,
        Body: vbuf,
        ContentType: 'video/mp4',
        ...(TRACE_KMS_KEY ? { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: TRACE_KMS_KEY } : {})
      })));
    }
  } catch {}
  return {
    traceUrl: `s3://${TRACE_S3_BUCKET}/${keyZip}`,
    shotUrl: `s3://${TRACE_S3_BUCKET}/${keyPng}`,
    videoUrl: videoPath ? `s3://${TRACE_S3_BUCKET}/${keyMp4}` : undefined,
  };
}

async function uploadVideoArtifact(jobId: string, videoPath: string) {
  if (!TRACE_S3_BUCKET) return null;
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const keyMp4 = `${TRACE_S3_PREFIX}${jobId}/${now}/page.mp4`;
  try {
    const vbuf = await fs.readFile(videoPath);
    await s3.send(new PutObjectCommand({
      Bucket: TRACE_S3_BUCKET,
      Key: keyMp4,
      Body: vbuf,
      ContentType: 'video/mp4',
      ...(TRACE_KMS_KEY ? { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: TRACE_KMS_KEY } : {})
    }));
    return { videoUrl: `s3://${TRACE_S3_BUCKET}/${keyMp4}` };
  } catch {
    return null;
  }
}

async function setLinkState(userId: string, state: string, errorCode?: string) {
  try {
    const exprVals: any = {
      ':s': { S: state },
      ':ts': { S: new Date().toISOString() },
    };
    const updateExpr = errorCode ? 'SET linkState = :s, updatedAt = :ts, errorCode = :e' : 'SET linkState = :s, updatedAt = :ts';
    if (errorCode) exprVals[':e'] = { S: String(errorCode) };
    await brDDB.exec(() => ddb.send(new UpdateItemCommand({
      TableName: TABLE_SESSIONS,
      Key: { userId: { S: userId } },
      UpdateExpression: updateExpr,
      ExpressionAttributeValues: exprVals,
    })));
  } catch {}
}

async function getCookies(userId: string) {
  const res = await brDDB.exec(() => ddb.send(new GetItemCommand({ TableName: TABLE_SESSIONS, Key: { userId: { S: userId } } })));
  const b64 = res.Item?.cookiesCipherB64?.S;
  if (!b64) throw new Error('No cookies');
  const dec = await brKMS.exec(() => kms.send(new DecryptCommand({ CiphertextBlob: Buffer.from(b64, 'base64') })));
  const json = Buffer.from(dec.Plaintext as Uint8Array).toString('utf-8');
  return JSON.parse(json);
}

async function metric(name: string, value: number) {
  try {
    await brCW.exec(() => cw.send(new PutMetricDataCommand({
      Namespace: 'Huntaze/OFWorker',
      MetricData: [{ MetricName: name, Value: value, Unit: 'Count' }],
    })));
  } catch {}
}

async function metricWith(name: string, value: number, unit: 'Count'|'Milliseconds'|'Megabytes', dims?: Record<string,string>) {
  try {
    await brCW.exec(() => cw.send(new PutMetricDataCommand({
      Namespace: 'Huntaze/OFWorker',
      MetricData: [{
        MetricName: name,
        Value: value,
        Unit: unit,
        Dimensions: dims ? Object.entries(dims).map(([Name, Value]) => ({ Name, Value })) : undefined,
      }],
    })));
  } catch {}
}

async function getCreds(secretId: string): Promise<{ email: string; password: string }> {
  const out = await brSM.exec(() => sm.send(new GetSecretValueCommand({ SecretId: secretId })));
  if (!out.SecretString) throw new Error('Secret empty');
  return JSON.parse(out.SecretString);
}

async function setRequiresAction(userId: string, flag: boolean) {
  await brDDB.exec(() => ddb.send(new PutItemCommand({
    TableName: TABLE_SESSIONS,
    Item: {
      userId: { S: userId },
      requiresAction: { BOOL: flag },
      updatedAt: { S: new Date().toISOString() },
    },
  })));
}

function stealthInit(context: BrowserContext) {
  return context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
}

async function ensureConnected(page: any, context: any): Promise<boolean> {
  try {
    const cookies = await context.cookies();
    const ofCookies = cookies.filter((c: any) => (c.domain || '').includes('onlyfans.com'));
    if (ofCookies.length === 0) return false;
    await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pwdVisible = await page
      .locator('input[type="password"], input[autocomplete="current-password"]').first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    return !pwdVisible;
  } catch {
    return false;
  }
}

async function run() {
  const sessionStart = Date.now();
  // Log environment to confirm overrides at runtime
  try {
    console.info('[ENV] ACTION=', process.env.ACTION);
    console.info('[ENV] USER_ID=', process.env.USER_ID);
    console.info('[ENV] JOB_ID=', JOB_ID || '');
    console.info('[ENV] CREDS_SECRET=', process.env.OF_CREDS_SECRET_ID || '');
  } catch {}
  const PROXY_SERVER = process.env.PROXY_SERVER || process.env.PROXY_HOST;
  const PROXY_USER = process.env.PROXY_USER;
  const PROXY_PASS = process.env.PROXY_PASS;
  const launchOpts: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding'
    ],
  };
  if (PROXY_SERVER) {
    launchOpts.proxy = {
      server: PROXY_SERVER,
      ...(PROXY_USER && PROXY_PASS ? { username: PROXY_USER, password: PROXY_PASS } : {}),
    };
    console.info('[ENV] PROXY in use =', PROXY_SERVER);
  }
  const browser = await chromium.launch(launchOpts);

  const tz = process.env.TIMEZONE_ID || 'America/New_York';
  const locale = process.env.LOCALE || 'en-US';
  const ua = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
  const randomizeViewport = (process.env.RANDOMIZE_VIEWPORT || '1') === '1';
  const baseW = 1366, baseH = 768;
  const width = randomizeViewport ? baseW + Math.floor(Math.random() * 200) : baseW;
  const height = randomizeViewport ? baseH + Math.floor(Math.random() * 200) : baseH;

  const context = await browser.newContext({
    locale,
    timezoneId: tz,
    userAgent: ua,
    viewport: { width, height },
    recordVideo: { dir: '/tmp/pwv', size: { width, height } },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  try { await context.tracing.start({ screenshots: true, snapshots: true, sources: true }); } catch {}
  await stealthInit(context);
  // Load existing cookies only when not performing a fresh login
  if (ACTION !== 'login') {
    try {
      const existing = await getCookies(USER_ID);
      await context.addCookies(existing as any);
    } catch {
      // No cookies yet; continue without
    }
  }
  const page = await context.newPage();

  try {
    if (ACTION === 'login') {
      const loginStart = Date.now();
      await setLinkState(USER_ID, 'LOGIN_STARTED');
      await reportState(USER_ID, 'LOGIN_STARTED');
      // Force canonical login URL to avoid deep-linking (e.g., /my/messages) before auth.
      // Navigate BEFORE any secret fetch to guarantee trace has early actions.
      console.info('[STEP] goto /login');
      await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
      console.info('[STEP] waitForURL /login|auth');
      await page.waitForURL(/\/(login|auth)/i, { timeout: 15000 }).catch(() => {});
      await page.getByRole('button', { name: /accept|agree/i }).click({ timeout: 2000 }).catch(() => {});
      if (!CREDS_SECRET_ID) throw new Error('OF_CREDS_SECRET_ID missing');
      const { email, password } = await getCreds(CREDS_SECRET_ID);
      // If a wrong route or error page is shown, correct to /login again
      const wrongRoute = /\/my\/messages/i.test(page.url());
      const sorryVisible = await page.getByText(/sorry\,? this page is not available/i).isVisible().catch(() => false);
      if (wrongRoute || sorryVisible) {
        console.info('[STEP] re-goto /login');
        await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForURL(/\/(login|auth)/i, { timeout: 15000 }).catch(() => {});
      }
      console.info('[LOGIN] using fillOneOf v2');
      console.info('[LOGIN] current url before scopeForLogin =', page.url());
      // Log known frames to aid debugging
      try { console.info('[LOGIN] frames =', (page.frames() || []).map((f: any) => f.url())); } catch {}
      let scope: any = await scopeForLogin(page);
      try { console.info('[LOGIN] after scopeForLogin url =', page.url()); } catch {}

      let usedForm = false;
      try {
        const loginForm = scope.locator('form').filter({
          has: scope.locator('input[type="password"], input[autocomplete="current-password"]').first()
        }).first();
        await loginForm.locator('input[autocomplete="username"], input[inputmode="email"], input[type="email"], input[name*="email" i]')
          .first().fill(email, { timeout: 10000 });
        await loginForm.locator('input[autocomplete="current-password"], input[type="password"]')
          .first().fill(password, { timeout: 10000 });
        await loginForm.getByRole('button', { name: /log in|sign in|continue/i })
          .or(loginForm.getByText(/log in|sign in|continue/i)).first().click({ timeout: 10000 });
        usedForm = true;
      } catch {}

      if (!usedForm) {
        console.info('[STEP] ensure email mode');
        scope = await ensureEmailMode(page, scope);
        console.info('[STEP] fill email');
        await fillOneOf(scope, [
          scope.getByRole('textbox', { name: /email|username/i }),
          scope.getByRole('combobox', { name: /email|username/i }),
          scope.getByLabel(/email|username|e-mail/i),
          scope.getByPlaceholder(/email|username|e-mail/i),
          'input[autocomplete="username"]',
          'input[autocomplete="email"]',
          'input[inputmode="email"]',
          'input[type="email"]',
          'input[name*="email" i]',
          'input[name="email"]',
          'input[id*="email" i]',
          'input[aria-label*="email" i]',
          'input[name*="login" i]'
        ], email, 10000);
        // Fallbacks: try shadow/light DOM and generic first textbox
        try {
          const pierce = page.locator('css:light(input[type="email"], input[autocomplete="email"])').first();
          if (await pierce.isVisible({ timeout: 1000 }).catch(() => false)) {
            await pierce.fill(email, { timeout: 4000 });
          }
        } catch {}
        try {
          const anyTb = scope.getByRole('textbox').first();
          if (await anyTb.isVisible({ timeout: 1000 }).catch(() => false)) {
            await anyTb.click({ timeout: 1000 }).catch(() => {});
            await page.keyboard.type(email, { delay: 50 });
          }
        } catch {}
        console.info('[STEP] fill password');
        await fillOneOf(scope, [
          scope.getByLabel(/password|passcode/i),
          scope.getByPlaceholder(/password|passcode/i),
          'input[autocomplete="current-password"]',
          'input[type="password"]'
        ], password, 10000);
        console.info('[STEP] click submit');
        await scope.getByRole('button', { name: /log in|sign in|continue/i })
          .or(scope.getByText(/log in|sign in|continue/i)).first().click({ timeout: 10000 });
      }
      console.info('[STEP] wait post-login URL');
      await page.waitForURL((url) => {
        try { return !/\/(login|auth)/i.test(new URL(url).pathname); } catch { return false; }
      }, { timeout: 15000 }).catch(() => {});
      // Post-submit state checks (OTP/challenge)
      const otpField = page.locator('input[name="code"], input[autocomplete="one-time-code"]');
      const challengeText = page.getByText(/challenge required|try again later|unusual|verify you|turnstile/i);
      const otpVisible = await otpField.first().isVisible({ timeout: 6000 }).catch(() => false);
      if (otpVisible) {
        await metric('LoginRequiresAction', 1);
        await setLinkState(USER_ID, 'OTP_REQUIRED');
        await reportState(USER_ID, 'OTP_REQUIRED');
        throw new Error('OTP required');
      }
      const challengeVisible = await challengeText.first().isVisible({ timeout: 2000 }).catch(() => false);
      if (challengeVisible) {
        await metric('LoginRequiresAction', 1);
        await setLinkState(USER_ID, 'CHALLENGE_REQUIRED');
        await reportState(USER_ID, 'CHALLENGE_REQUIRED');
        throw new Error('Challenge presented');
      }

      const needsOtp = await page.locator('input[name="code"], input[autocomplete="one-time-code"]').count();
      if (needsOtp > 0 && !OTP_CODE) {
        await setRequiresAction(USER_ID, true);
        await metric('LoginRequiresAction', 1);
        await setLinkState(USER_ID, 'OTP_REQUIRED');
        await reportState(USER_ID, 'OTP_REQUIRED');
        throw new Error('OTP required');
      }
      if (needsOtp > 0 && OTP_CODE) {
        await page.fill('input[name="code"], input[autocomplete="one-time-code"]', OTP_CODE);
        const otpSubmit = page.getByRole('button', { name: /submit|continue|verify/i });
        if (await otpSubmit.isVisible().catch(() => false)) {
          await otpSubmit.click();
        } else {
          await page.click('button[type="submit"]').catch(() => {});
        }
      }

      const cookies = await context.cookies();
      const onlyfansCookies = cookies.filter(c => (c.domain || '').includes('onlyfans.com'));
      const enc = await brKMS.exec(() => kms.send(new EncryptCommand({ KeyId: KMS_KEY_ID, Plaintext: Buffer.from(JSON.stringify(onlyfansCookies)) })));
      await brDDB.exec(() => ddb.send(new PutItemCommand({
        TableName: TABLE_SESSIONS,
        Item: {
          userId: { S: USER_ID },
          cookiesCipherB64: { S: Buffer.from(enc.CiphertextBlob as Uint8Array).toString('base64') },
          requiresAction: { BOOL: false },
          updatedAt: { S: new Date().toISOString() },
        },
      })));
      await metric('LoginSuccess', 1);
      await metricWith('LoginSuccessCount', 1, 'Count', { Action: 'login' });
      await metricWith('ActionDurationMs', Date.now() - loginStart, 'Milliseconds', { Action: 'login' });
      await setLinkState(USER_ID, 'CONNECTED');
      await reportState(USER_ID, 'CONNECTED');
      return;
    }

    if (ACTION === 'inbox') {
      // Guard: throttle inbox sync to avoid platform suspicion (default 1h)
      try {
        const minIntervalSec = Number(process.env.OF_INBOX_SYNC_MIN_INTERVAL_SEC || '3600');
        const sess = await ddb.send(new GetItemCommand({ TableName: TABLE_SESSIONS, Key: { userId: { S: USER_ID } } }));
        const lastSyncAt = Number(sess.Item?.lastInboxSyncAt?.N || '0');
        const nowSec = Math.floor(Date.now() / 1000);
        if (minIntervalSec > 0 && lastSyncAt && nowSec - lastSyncAt < minIntervalSec) {
          console.log(JSON.stringify({ type: 'inbox', skipped: true, reason: 'throttled', lastSyncAt, nowSec }));
          await metric('InboxSyncThrottled', 1);
          return;
        }
      } catch {}

      // Guard: ensure session is valid before deep-linking to /my/messages
      if (!(await ensureConnected(page, context))) {
        await setLinkState(USER_ID, 'LOGIN_REQUIRED');
        await reportState(USER_ID, 'LOGIN_REQUIRED');
        throw new Error('LOGIN_REQUIRED');
      }
      await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000 + Math.random() * 3000);
      const items = await page.evaluate(() => {
        const list = Array.from(document.querySelectorAll('[data-e2e="message-item"]')) as HTMLElement[];
        return list.slice(0, 50).map(el => ({
          id: el.getAttribute('data-id') || '',
          threadId: el.getAttribute('data-thread-id') || '',
          author: (el.querySelector('[data-e2e="author"]') as HTMLElement)?.innerText || '',
          username: (el.querySelector('[data-e2e="username"]') as HTMLElement)?.innerText || '',
          text: (el.querySelector('[data-e2e="text"]') as HTMLElement)?.innerText || '',
          ts: Date.now(),
          unread: !!el.querySelector('[data-e2e="unread-badge"]')
        }));
      });

      // Persist basic thread/message info in DynamoDB
      try {
        // Threads table: HuntazeOfThreads (PK userId S, SK threadId S)
        // Messages table: HuntazeOfMessages (PK userThread S=userId#threadId, SK sortKey S=ts#<epoch>#<msgId>)
        const threadsTable = process.env.OF_DDB_THREADS_TABLE;
        const messagesTable = process.env.OF_DDB_MESSAGES_TABLE;
        if (threadsTable && messagesTable) {
          // Batch write (chunks of 25)
          type PutReq = {
            PutRequest: { Item: Record<string, any> }
          };
          const chunk = <T>(arr: T[], n = 25) => arr.reduce<T[][]>((a, c, i) => { (a[Math.floor(i / n)] ||= []).push(c); return a; }, []);

          const nowIso = new Date().toISOString();
          const threadReqs: PutReq[] = items.map((it) => ({
            PutRequest: {
              Item: {
                userId: { S: USER_ID },
                threadId: { S: String(it.threadId || it.id || '') },
                fanId: { S: String(it.username || it.author || '') },
                lastMessageId: { S: String(it.id || '') },
                lastActivityAt: { N: String(Math.floor((it.ts || Date.now()) / 1000)) },
                unreadCount: { N: it.unread ? '1' : '0' },
                updatedAt: { S: nowIso },
              }
            }
          }));

          const msgReqs: PutReq[] = items.map((it) => {
            const threadId = String(it.threadId || it.id || '');
            const userThread = `${USER_ID}#${threadId}`;
            const ts = it.ts || Date.now();
            const sortKey = `ts#${ts}#${it.id || Math.random().toString(36).slice(2)}`;
            return {
              PutRequest: {
                Item: {
                  userThread: { S: userThread },
                  sortKey: { S: sortKey },
                  messageId: { S: String(it.id || '') },
                  direction: { S: 'IN' },
                  type: { S: 'text' },
                  text: { S: String(it.text || '') },
                  createdAt: { N: String(Math.floor(ts / 1000)) },
                  updatedAt: { S: nowIso },
                }
              }
            };
          });

          for (const group of chunk(threadReqs, 25)) {
            await ddb.send(new BatchWriteItemCommand({
              RequestItems: { [threadsTable]: group }
            }));
          }
          for (const group of chunk(msgReqs, 25)) {
            await ddb.send(new BatchWriteItemCommand({
              RequestItems: { [messagesTable]: group }
            }));
          }

          // Update session metadata
          try {
            await ddb.send(new UpdateItemCommand({
              TableName: TABLE_SESSIONS,
              Key: { userId: { S: USER_ID } },
              UpdateExpression: 'SET lastInboxSyncAt = :now, updatedAt = :iso',
              ExpressionAttributeValues: { ':now': { N: String(Math.floor(Date.now() / 1000)) }, ':iso': { S: nowIso } }
            }));
          } catch {}
        }
      } catch (e) {
        console.warn('inbox.persist.failed', e);
      }

      console.log(JSON.stringify({ type: 'inbox', count: items.length }));
      await metric('InboxSyncSuccess', 1);
      return;
    }

    if (ACTION === 'send') {
      if (!CONVERSATION_ID || !CONTENT_TEXT) throw new Error('Missing CONVERSATION_ID or CONTENT_TEXT');
      // Guard: ensure session is valid before deep-linking to /my/messages
      if (!(await ensureConnected(page, context))) {
        await setLinkState(USER_ID, 'LOGIN_REQUIRED');
        await reportState(USER_ID, 'LOGIN_REQUIRED');
        throw new Error('LOGIN_REQUIRED');
      }
      await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000 + Math.random() * 3000);
      // TODO: cibler la conversation par CONVERSATION_ID
      // If PPV fields are present, attempt a PPV-style send (best effort)
      const isPpv = typeof PPV_PRICE_CENTS === 'number' && !Number.isNaN(PPV_PRICE_CENTS);
      try {
        // Basic compose; PPV handling UI is site-dependent. We always send the text.
        const text = (PPV_CAPTION && PPV_CAPTION.length > 0) ? PPV_CAPTION : CONTENT_TEXT;
        await page.fill('textarea', text);
        // Future: attach media and set price when reliable selectors are confirmed
        if (isPpv) {
          console.log(JSON.stringify({ type: 'ppv-meta', jobId: JOB_ID, priceCents: PPV_PRICE_CENTS, variant: PPV_VARIANT, mediaUrl: PPV_MEDIA_URL }));
        }
        await page.click('button:has-text("Send")');
      } catch (ppvErr) {
        console.warn('send.compose.failed', ppvErr);
      }
      await page.waitForTimeout(2000 + Math.random() * 3000);

      await ddb.send(new PutItemCommand({
        TableName: TABLE_MESSAGES,
        Item: {
          id: { S: JOB_ID || `of_${Date.now()}` },
          userId: { S: USER_ID },
          conversationId: { S: CONVERSATION_ID },
          status: { S: 'sent' },
          content: { S: (PPV_CAPTION && PPV_CAPTION.length > 0) ? PPV_CAPTION : (CONTENT_TEXT || '') },
          ...(isPpv ? { ppv: { M: {
            priceCents: { N: String(PPV_PRICE_CENTS) },
            ...(PPV_VARIANT ? { variant: { S: String(PPV_VARIANT) } } : {}),
            ...(PPV_MEDIA_URL ? { mediaUrl: { S: String(PPV_MEDIA_URL) } } : {}),
          } } } : {}),
          ts: { N: String(Date.now()) }
        }
      }));
      console.log(JSON.stringify({ type: 'send', ok: true, jobId: JOB_ID || null, mode: isPpv ? 'ppv' : 'text' }));
      await metric('MessagesSent', 1);
      return;
    }

    throw new Error(`Unknown ACTION=${ACTION}`);
  } finally {
    try { await context.tracing.stop({ path: '/tmp/trace.zip' }); } catch {}
    try {
      const jobId = `job-${Date.now()}`;
      // Upload trace + screenshot while page is still open
      const uploaded = await uploadTraceArtifacts(USER_ID || jobId, page).catch(() => null);
      if (uploaded) {
        console.log(JSON.stringify({ traceS3: uploaded.traceUrl, screenshotS3: uploaded.shotUrl }));
      }
      // Ensure video is finalized by closing the page, then upload
      let videoPath: string | undefined;
      try { await page.close({ runBeforeUnload: false }); } catch {}
      try { videoPath = (await page.video()?.path()) as string; } catch {}
      if (videoPath) {
        const v = await uploadVideoArtifact(USER_ID || jobId, videoPath).catch(() => null);
        if (v?.videoUrl) console.log(JSON.stringify({ videoS3: v.videoUrl }));
      }
    } catch {}
    // Emit session metrics at the very end
    try {
      const dur = Date.now() - sessionStart;
      await metricWith('SessionDurationMs', dur, 'Milliseconds').catch(() => {});
      const memMb = Math.round((process.memoryUsage().rss || 0) / (1024 * 1024));
      await metricWith('MemoryUsageMB', memMb, 'Megabytes').catch(() => {});
    } catch {}
    await context.close();
    await browser.close();
  }
}

run().catch((e) => {
  console.error(JSON.stringify({ error: e?.message || String(e) }));
  metric('MessagesFailed', 1).catch(() => {});
  try {
    if ((process.env.ACTION || 'login') === 'login') {
      metric('LoginFailures', 1).catch(() => {});
      metricWith('LoginFailureCount', 1, 'Count', { Action: 'login' }).catch(() => {});
    }
  } catch {}
  if (USER_ID) {
    const msg = e?.message || String(e);
    const mapped = /OTP required/i.test(msg)
      ? 'OTP_REQUIRED'
      : /Challenge/i.test(msg)
      ? 'CHALLENGE_REQUIRED'
      : /No candidate could be filled|No visible candidate|LOGIN_FORM_NOT_FOUND/i.test(msg)
      ? 'LOGIN_FORM_NOT_FOUND'
      : 'FAILED';
    setLinkState(USER_ID, mapped, msg).catch(() => {});
    reportState(USER_ID, mapped, msg).catch(() => {});
  }
  process.exitCode = 1;
});
