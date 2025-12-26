import { test as base, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_TEST_EMAIL || 'e2e@huntaze.test';
const PASSWORD = process.env.E2E_TEST_PASSWORD || 'password123';
const apiMode = (process.env.NEXT_PUBLIC_API_MODE ?? process.env.API_MODE ?? 'real').toLowerCase();
const RAW_USER_ID = (process.env.E2E_TEST_USER_ID ?? '').trim();
const HAS_NUMERIC_USER_ID = RAW_USER_ID.length > 0 && /^[0-9]+$/.test(RAW_USER_ID);
const E2E_USER_ID = HAS_NUMERIC_USER_ID ? RAW_USER_ID : '1';
const RUN_ID = process.env.E2E_RUN_ID || Date.now().toString(36);
const USER_TAG = HAS_NUMERIC_USER_ID ? `U${RAW_USER_ID}` : 'UUNKNOWN';
const NAME_PREFIX = process.env.E2E_NAME_PREFIX || `E2E_SMOKE_${USER_TAG}_${RUN_ID}`;
const IS_DESTRUCTIVE = process.env.E2E_DESTRUCTIVE === '1';
const BACKEND_5XX_PATTERNS = [
  /\/api\/marketing\/campaigns\b/,
  /\/api\/content\b/,
];

type CleanupTask = (page: Page) => Promise<void>;
type CleanupController = {
  add: (task: CleanupTask) => void;
  namePrefix: string;
  runId: string;
  isDestructive: boolean;
};
type BackendFailure = {
  url: string;
  status: number;
  method: string;
};
type BackendFailureMonitor = {
  getFailures: () => BackendFailure[];
  dispose: () => void;
};

const test = base.extend<{ cleanup: CleanupController }>({
  cleanup: async ({ page }, use, testInfo) => {
    const tasks: CleanupTask[] = [];
    await use({
      add: (task) => tasks.push(task),
      namePrefix: NAME_PREFIX,
      runId: RUN_ID,
      isDestructive: IS_DESTRUCTIVE,
    });
    for (const task of tasks.reverse()) {
      try {
        await task(page);
      } catch (error) {
        const body = error instanceof Error ? error.stack ?? error.message : String(error);
        await testInfo.attach(`cleanup-error-${Date.now()}`, {
          body,
          contentType: 'text/plain',
        });
      }
    }
  },
});

const backendMonitors = new WeakMap<Page, BackendFailureMonitor>();

type ApiRequestOptions = {
  data?: unknown;
  headers?: Record<string, string>;
};

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('input#email', EMAIL);
  await page.fill('input#password', PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/home/);
}

async function apiRequest<T = any>(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: ApiRequestOptions = {}
) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await page.request.fetch(url, {
    method,
    data: options.data,
    headers: options.headers,
  });
  const json = await response.json().catch(() => null);
  return { response, json: json as T };
}

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function makeName(prefix: string, label: string) {
  const safePrefix = sanitizeName(prefix);
  const safeLabel = sanitizeName(label);
  return `${safePrefix}_${safeLabel}_${Date.now().toString(36)}`;
}

async function getCsrfToken(page: Page): Promise<string> {
  const { response, json } = await apiRequest<{
    success?: boolean;
    data?: { token?: string };
  }>(page, 'GET', '/api/csrf/token');

  expect(response.ok()).toBeTruthy();
  const token = json?.data?.token;
  expect(token).toBeTruthy();
  return token as string;
}

async function assertNoMsw(page: Page) {
  const { registrations, controllerUrl } = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { registrations: [], controllerUrl: null };
    const entries = await navigator.serviceWorker.getRegistrations();
    const urls = entries.map((registration) => (
      registration.active?.scriptURL ||
      registration.waiting?.scriptURL ||
      registration.installing?.scriptURL ||
      ''
    ));
    const controller = navigator.serviceWorker.controller?.scriptURL ?? null;
    return { registrations: urls, controllerUrl: controller };
  });

  const hasMsw = registrations.some((url) => url.includes('mockServiceWorker.js')) ||
    (controllerUrl ?? '').includes('mockServiceWorker.js');
  expect(hasMsw).toBe(false);
}

function monitorBackend5xx(page: Page, patterns: RegExp[]): BackendFailureMonitor {
  const failures: BackendFailure[] = [];
  const handler = (response: { url: () => string; status: () => number; request: () => { method: () => string } }) => {
    const url = response.url();
    if (!patterns.some((pattern) => pattern.test(url))) return;
    const status = response.status();
    if (status >= 500) {
      failures.push({
        url,
        status,
        method: response.request().method(),
      });
    }
  };

  page.on('response', handler);

  return {
    getFailures: () => [...failures],
    dispose: () => page.off('response', handler),
  };
}

async function assertDbPreflight(page: Page, creatorId: string) {
  const profileResponse = await apiRequest<{ error?: string }>(page, 'GET', '/api/users/profile');
  if (profileResponse.response.status() >= 500) {
    const message = profileResponse.json?.error ?? 'Unknown error';
    throw new Error(
      `DB preflight failed: /api/users/profile returned ${profileResponse.response.status()} (${message}). Possible pg_hba.conf / DB connectivity issue.`
    );
  }
  expect(profileResponse.response.ok()).toBeTruthy();

  const messagesResponse = await apiRequest<{ error?: string }>(
    page,
    'GET',
    `/api/messages/unified?creatorId=${encodeURIComponent(creatorId)}&limit=1&offset=0`,
  );
  if (messagesResponse.response.status() >= 500) {
    const message = messagesResponse.json?.error ?? 'Unknown error';
    throw new Error(
      `DB preflight failed: /api/messages/unified returned ${messagesResponse.response.status()} (${message}). Possible pg_hba.conf / DB connectivity issue.`
    );
  }
  expect(messagesResponse.response.ok()).toBeTruthy();
}

async function deleteCampaign(page: Page, campaignId: string, csrfToken?: string) {
  const { response } = await apiRequest(page, 'DELETE', `/api/marketing/campaigns/${campaignId}`, {
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });
  if (!response.ok() && response.status() !== 404) {
    expect(response.ok()).toBeTruthy();
  }
}

async function deleteContent(page: Page, contentId: string, csrfToken?: string) {
  const { response } = await apiRequest(page, 'DELETE', `/api/content/${contentId}`, {
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });
  if (!response.ok() && response.status() !== 404) {
    expect(response.ok()).toBeTruthy();
  }
}

async function deleteAutomation(page: Page, automationId: string, csrfToken?: string) {
  const { response } = await apiRequest(page, 'DELETE', `/api/automations/${automationId}`, {
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });
  if (!response.ok() && response.status() !== 404) {
    expect(response.ok()).toBeTruthy();
  }
}

test.describe('Real backend smoke (no MSW)', () => {
  test.skip(!process.env.E2E_TESTING, 'Requires E2E_TESTING=1 to enable credentials login.');
  test.skip(apiMode === 'mock', 'Requires API_MODE=real.');
  test.skip(!HAS_NUMERIC_USER_ID, 'Requires numeric E2E_TEST_USER_ID to avoid hitting the wrong account.');
  test.use({ serviceWorkers: 'block' });
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test.beforeEach(async ({ page }) => {
    backendMonitors.set(page, monitorBackend5xx(page, BACKEND_5XX_PATTERNS));
    await login(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const monitor = backendMonitors.get(page);
    if (!monitor) return;
    monitor.dispose();
    const failures = monitor.getFailures();
    if (failures.length > 0) {
      await testInfo.attach('backend-5xx', {
        body: JSON.stringify(failures, null, 2),
        contentType: 'application/json',
      });
    }
    expect(failures, 'Backend 5xx during smoke').toEqual([]);
  });

  test('backend preflight (db connectivity)', async ({ page }) => {
    await assertDbPreflight(page, E2E_USER_ID);
  });

  test('marketing war room loads without MSW', async ({ page, cleanup }) => {
    await page.goto(`${BASE_URL}/marketing`);
    await expect(page.getByRole('heading', { name: 'Marketing' })).toBeVisible({ timeout: 20000 });
    await assertNoMsw(page);

    const { response } = await apiRequest(page, 'GET', '/api/marketing-war-room/state');
    expect(response.ok()).toBeTruthy();

    const loadingQueue = page.getByText(/Loading queue/i);
    if (await loadingQueue.isVisible()) {
      await expect(loadingQueue).toBeHidden({ timeout: 20000 });
    }

    const queueError = page.getByText('Could not load queue');
    if (await queueError.isVisible()) {
      const retryButton = page.getByRole('button', { name: 'Retry' });
      if (await retryButton.isVisible()) {
        await retryButton.click();
        if (await loadingQueue.isVisible()) {
          await expect(loadingQueue).toBeHidden({ timeout: 20000 });
        }
      }
    }

    await expect(page.getByText('Could not load queue')).toHaveCount(0);
    await expect(page.getByText('Action failed')).toHaveCount(0);
    await expect(page.getByText('Failed to update automation')).toHaveCount(0);

    const toggles = page.locator('button[role="switch"]');
    const toggleCount = await toggles.count();
    if (toggleCount > 0) {
      const firstToggle = toggles.first();
      if (cleanup.isDestructive) {
        const initialState = await firstToggle.getAttribute('aria-checked');
        const nextState = initialState === 'true' ? 'false' : 'true';
        await firstToggle.click();
        await expect(firstToggle).toHaveAttribute('aria-checked', nextState);
      } else {
        await expect(firstToggle).toBeVisible();
      }
    } else {
      await expect(page.getByRole('heading', { name: 'Automations' })).toBeVisible();
    }
  });

  test('marketing campaign creation redirects', async ({ page, cleanup }) => {
    const csrfToken = await getCsrfToken(page);
    const campaignName = makeName(cleanup.namePrefix, 'campaign');

    await page.goto(`${BASE_URL}/marketing/campaigns/new`);
    try {
      await expect(page.getByRole('heading', { name: 'Create Campaign' })).toBeVisible({ timeout: 30000 });
    } catch {
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Create Campaign' })).toBeVisible({ timeout: 30000 });
    }
    await assertNoMsw(page);

    await page.getByPlaceholder(/Welcome New Subscribers/i).fill(campaignName);
    await page.getByPlaceholder(/Write your message/i).fill('Hello {{name}}, quick check-in from Huntaze.');

    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    const campaignsUrl = /\/marketing\/campaigns(\/.*)?$/;
    try {
      await page.waitForURL(campaignsUrl, { timeout: 30000 });
    } catch {
      const errorToast = page.getByText('Failed to create campaign');
      if (await errorToast.isVisible().catch(() => false)) {
        await saveButton.click();
      }
      await page.waitForURL(campaignsUrl, { timeout: 30000 });
    }

    const urlMatch = page.url().match(/\/marketing\/campaigns\/([^/?#]+)/);
    if (urlMatch?.[1] && urlMatch[1] !== 'new') {
      const campaignId = urlMatch[1];
      cleanup.add((page) => deleteCampaign(page, campaignId, csrfToken));
    }
  });

  test('analytics churn re-engage works', async ({ page, cleanup }) => {
    await page.goto(`${BASE_URL}/analytics/churn`);
    await expect(page.getByRole('heading', { name: 'Churn Analytics' })).toBeVisible();
    await assertNoMsw(page);

    const loadingChurn = page.getByText(/Loading churn insights/i);
    if (await loadingChurn.isVisible()) {
      await expect(loadingChurn).toBeHidden({ timeout: 20000 });
    }

    const reEngageButtons = page.getByRole('button', { name: 'Re-engage' });
    const count = await reEngageButtons.count();
    if (count > 0) {
      if (cleanup.isDestructive) {
        await reEngageButtons.first().click();
        await expect(page.getByTestId('banner-title')).toHaveText(/Re-engagement sent/i);
      } else {
        await expect(reEngageButtons.first()).toBeVisible();
      }
    } else {
      await expect(page.getByText('No fans at risk')).toBeVisible();
    }
  });

  test('analytics forecast timeline and recommendations render', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics/forecast`);
    await expect(page.getByRole('heading', { name: 'Revenue Forecast' })).toBeVisible();
    await assertNoMsw(page);

    const loadingForecast = page.getByText(/Loading forecast data/i);
    if (await loadingForecast.isVisible()) {
      await expect(loadingForecast).toBeHidden({ timeout: 20000 });
    }

    const emptyForecast = page.getByText('No forecast data yet');
    if (await emptyForecast.isVisible()) {
      await expect(emptyForecast).toBeVisible();
      return;
    }

    const timelineRows = page.locator('table tbody tr');
    const rowCount = await timelineRows.count();
    if (rowCount === 0) {
      await expect(page.getByText('No forecast points yet')).toBeVisible();
    } else {
      expect(rowCount).toBeGreaterThan(0);
    }

    const recommendationCards = page.locator('text=/effort/i');
    const recCount = await recommendationCards.count();
    if (recCount === 0) {
      await expect(page.getByText('No recommendations yet')).toBeVisible();
    } else {
      expect(recCount).toBeGreaterThan(0);
    }
  });

  test('integrations page loads and refreshes', async ({ page }) => {
    await page.goto(`${BASE_URL}/integrations`);
    await page.waitForSelector(
      '[data-testid="dashboard-error-state"], h1:has-text("Integrations")',
      { timeout: 30000 },
    );

    const errorState = page.getByTestId('dashboard-error-state');
    if (await errorState.isVisible()) {
      const retryButton = page.getByRole('button', { name: 'Retry' });
      if (await retryButton.isVisible()) {
        await retryButton.click();
      }
    }

    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible({ timeout: 30000 });
    await assertNoMsw(page);

    const loadingState = page.getByTestId('dashboard-loading-state');
    if (await loadingState.isVisible()) {
      await expect(loadingState).toBeHidden({ timeout: 30000 });
    }

    await expect(page.getByTestId('dashboard-error-state')).toHaveCount(0);

    const refreshButton = page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
    }

    await expect(page.getByRole('heading', { name: 'Your Platforms' })).toBeVisible();
    const actionButtons = page.getByRole('button', { name: /(Connect|Disconnect|Reconnect)/i });
    expect(await actionButtons.count()).toBeGreaterThan(0);
  });

  test('content create/schedule/update flow and schedule UI', async ({ page, cleanup }) => {
    test.setTimeout(120000);
    const contentTitle = makeName(cleanup.namePrefix, 'content');
    const csrfToken = await getCsrfToken(page);
    const csrfHeaders = { 'x-csrf-token': csrfToken };

    const createResponse = await apiRequest<{
      data?: { id?: string };
    }>(page, 'POST', '/api/content', {
      data: {
        title: contentTitle,
        text: 'E2E smoke content body.',
        type: 'text',
        platform: 'onlyfans',
        status: 'draft',
        tags: ['e2e', 'smoke'],
      },
      headers: csrfHeaders,
    });

    expect(createResponse.response.ok()).toBeTruthy();
    const contentId = createResponse.json?.data?.id ?? null;
    expect(contentId).toBeTruthy();
    if (!contentId) return;

    cleanup.add((page) => deleteContent(page, contentId, csrfToken));

    const listResponse = await apiRequest<{
      data?: { items?: Array<{ id: string }> };
    }>(page, 'GET', '/api/content?limit=50&offset=0');
    expect(listResponse.response.ok()).toBeTruthy();

    const items = listResponse.json?.data?.items ?? [];
    expect(items.some((item) => item.id === contentId)).toBe(true);

    const detailResponse = await apiRequest<{ data?: { id?: string } }>(
      page,
      'GET',
      `/api/content/${contentId}`,
    );
    expect(detailResponse.response.ok()).toBeTruthy();
    expect(detailResponse.json?.data?.id).toBe(contentId);

    if (cleanup.isDestructive) {
      const scheduledAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const scheduleResponse = await apiRequest(page, 'POST', '/api/content/schedule', {
        data: {
          contentId,
          scheduledAt,
          platforms: ['onlyfans'],
        },
        headers: csrfHeaders,
      });
      expect(scheduleResponse.response.ok()).toBeTruthy();
    }

    await page.goto(`${BASE_URL}/schedule`);
    const sessionLoading = page.getByTestId('dashboard-loading-state');
    if (await sessionLoading.isVisible()) {
      await expect(sessionLoading).toBeHidden({ timeout: 30000 });
    }
    await expect(page.getByRole('heading', { name: 'Content', exact: true }))
      .toBeVisible({ timeout: 30000 });
    await assertNoMsw(page);
    if (cleanup.isDestructive) {
      await expect(page.getByText(contentTitle).first()).toBeVisible({ timeout: 20000 });

      const updateResponse = await apiRequest(page, 'PUT', `/api/content/${contentId}`, {
        data: {
          status: 'published',
          publishedAt: new Date().toISOString(),
        },
        headers: csrfHeaders,
      });
      expect(updateResponse.response.ok()).toBeTruthy();

      const updatedDetail = await apiRequest<{ data?: { status?: string } }>(
        page,
        'GET',
        `/api/content/${contentId}`,
      );
      expect(updatedDetail.response.ok()).toBeTruthy();
      expect(updatedDetail.json?.data?.status).toBe('published');
    }
  });

  test('content insights page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/content`);
    await expect(page.getByRole('heading', { name: 'Content' })).toBeVisible();
    await assertNoMsw(page);

    await expect(page.getByText('Failed to load content insights')).toHaveCount(0);

    const emptyState = page.getByText('No content insights yet');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(page.getByText(/Trending now/i)).toBeVisible();
    const tiktokFilter = page.getByRole('button', { name: 'TikTok' });
    if (await tiktokFilter.isVisible()) {
      await tiktokFilter.click();
    }
  });

  test('onlyfans pages load', async ({ page, cleanup }) => {
    test.setTimeout(120000);
    await page.goto(`${BASE_URL}/onlyfans`);
    await page.waitForSelector(
      '[data-testid="dashboard-error-state"], h1:has-text("OnlyFans")',
      { timeout: 30000 },
    );
    const errorState = page.getByTestId('dashboard-error-state');
    if (await errorState.isVisible()) {
      const retryButton = page.getByRole('button', { name: 'Retry' });
      if (await retryButton.isVisible()) {
        await retryButton.click();
      }
    }

    await expect(page.getByRole('heading', { name: 'OnlyFans', exact: true }))
      .toBeVisible({ timeout: 30000 });
    await assertNoMsw(page);

    const connectState = page.getByText('Connect OnlyFans to see your dashboard');
    if (await connectState.isVisible()) {
      await expect(connectState).toBeVisible();
    } else {
      await expect(page.getByText(/Monthly Revenue/i)).toBeVisible();
    }

    const refreshButton = page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
    }

    await page.goto(`${BASE_URL}/onlyfans/fans`);
    await expect(page.getByRole('heading', { level: 1, name: /Fans/i })).toBeVisible();

    const loadingFans = page.getByText('Loading fans...');
    if (await loadingFans.isVisible()) {
      await expect(loadingFans).toBeHidden({ timeout: 20000 });
    }

    const emptyFans = page.getByText('Connect OnlyFans to view your fans');
    if (await emptyFans.isVisible()) {
      await expect(emptyFans).toBeVisible();
    } else {
      const fanLink = page.locator('a[href^="/onlyfans/fans/"]').first();
      if (await fanLink.count()) {
        await fanLink.click();
        await expect(page.getByRole('button', { name: /Send Message/i })).toBeVisible();
      }
    }

    await page.goto(`${BASE_URL}/onlyfans/messages`);
    await expect(page.getByRole('region', { name: 'Conversations list' })).toBeVisible();
    await assertNoMsw(page);

    const messagesLoading = page.getByText('Loading messages...');
    if (await messagesLoading.isVisible()) {
      await expect(messagesLoading).toBeHidden({ timeout: 20000 });
    }

    await expect(page.getByText('Failed to load conversations.')).toHaveCount(0);

    const noConversations = page.getByText('No conversations');
    if (await noConversations.isVisible()) {
      await expect(noConversations).toBeVisible();
      return;
    }

    const firstConversation = page.locator('[data-conversation-id]').first();
    if (await firstConversation.count()) {
      await firstConversation.click();
      const messageInput = page.getByLabel('Message input');
      await expect(messageInput).toBeVisible();
      if (cleanup.isDestructive) {
        await messageInput.fill(`${cleanup.namePrefix}_ping`);
        await page.getByRole('button', { name: 'Send message' }).click();
        await expect(page.getByText('Failed to send message.')).toHaveCount(0);
      }
    }
  });

  test('automations create/edit/delete', async ({ page, cleanup }) => {
    const automationName = makeName(cleanup.namePrefix, 'automation');
    const stepSuffix = `${cleanup.runId}-${Date.now().toString(36)}`;
    const csrfToken = await getCsrfToken(page);

    const createResponse = await apiRequest<{
      data?: { id?: string };
    }>(page, 'POST', '/api/automations', {
      data: {
        name: automationName,
        status: 'draft',
        steps: [
          {
            id: `trigger-${stepSuffix}`,
            type: 'trigger',
            name: 'new_subscriber',
            config: {},
          },
          {
            id: `action-${stepSuffix}`,
            type: 'action',
            name: 'send_message',
            config: {
              template: 'Welcome to Huntaze!',
            },
          },
        ],
      },
      headers: {
        'x-csrf-token': csrfToken,
      },
    });

    expect(createResponse.response.ok()).toBeTruthy();
    const automationId = createResponse.json?.data?.id ?? null;
    expect(automationId).toBeTruthy();
    if (!automationId) return;

    cleanup.add((page) => deleteAutomation(page, automationId, csrfToken));

    await page.goto(`${BASE_URL}/automations/${automationId}`);
    await expect(page.getByRole('heading', { name: 'Edit Automation' })).toBeVisible();
    await assertNoMsw(page);

    const statusSelect = page.getByRole('combobox');
    await expect(statusSelect).toBeVisible();
    if (cleanup.isDestructive) {
      await statusSelect.selectOption('active');
      await Promise.all([
        page.waitForResponse((response) =>
          response.url().includes(`/api/automations/${automationId}`)
          && response.request().method() === 'PUT'
          && response.ok(),
        ),
        page.getByRole('button', { name: /save changes/i }).click(),
      ]);
      await page.waitForURL(/\/automations$/);
    } else {
      await page.goto(`${BASE_URL}/automations`);
    }

    const loadingState = page.getByTestId('dashboard-loading-state');
    if (await loadingState.isVisible()) {
      await expect(loadingState).toBeHidden({ timeout: 30000 });
    }

    const errorState = page.getByTestId('dashboard-error-state');
    if (await errorState.isVisible()) {
      const retryButton = page.getByRole('button', { name: 'Retry' });
      if (await retryButton.isVisible()) {
        await retryButton.click();
        if (await loadingState.isVisible()) {
          await expect(loadingState).toBeHidden({ timeout: 30000 });
        }
      }
    }

    await expect.poll(async () => {
      const { response, json } = await apiRequest<{ data?: Array<{ id: string }> }>(
        page,
        'GET',
        '/api/automations',
      );
      if (!response.ok()) return false;
      return (json?.data ?? []).some((automation) => automation.id === automationId);
    }, { timeout: 15000 }).toBe(true);

    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
    } catch {
      await page.goto(`${BASE_URL}/automations`, { waitUntil: 'domcontentloaded' });
    }
    if (await loadingState.isVisible()) {
      await expect(loadingState).toBeHidden({ timeout: 30000 });
    }

    await expect(page.getByText(automationName, { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('chatbot threads and messages', async ({ page, cleanup }) => {
    await page.goto(`${BASE_URL}/chatbot`);
    await expect(page.getByRole('heading', { name: 'AI Assistant', level: 1, exact: true })).toBeVisible();
    await assertNoMsw(page);

    const messageInput = page.getByPlaceholder('Type your message...');
    if (!(await messageInput.isVisible())) {
      const newChatButton = page.getByRole('button', { name: /new chat/i });
      await newChatButton.click();
    }

    await expect(messageInput).toBeVisible();
    if (cleanup.isDestructive) {
      await messageInput.fill(`${cleanup.namePrefix}_ping`);
      await page.getByRole('button', { name: 'Send message' }).click();
      await expect(page.getByText(/Would you like a short answer|Got it, CEO/i)).toBeVisible({ timeout: 20000 });
    }
  });

  test('settings save preferences', async ({ page, cleanup }) => {
    await page.goto(`${BASE_URL}/settings`);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await assertNoMsw(page);

    await expect(page.getByText('Failed to load settings')).toHaveCount(0);

    const darkModeInput = page.locator('input#darkMode');
    const darkModeTrack = page
      .getByTestId('settings-item-darkMode')
      .getByTestId('toggle-track');
    await expect(darkModeInput).toBeVisible();

    if (cleanup.isDestructive) {
      const initialValue = await darkModeInput.isChecked();
      await darkModeTrack.click();
      await page.getByRole('button', { name: /save changes/i }).click();
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 20000 });

      const nextValue = await darkModeInput.isChecked();
      if (nextValue !== initialValue) {
        await darkModeTrack.click();
        await page.getByRole('button', { name: /save changes/i }).click();
        await expect(page.getByText('Saved.')).toBeVisible({ timeout: 20000 });
      }
    }
  });
});
