import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { chromium } from 'playwright'
import { LOGIN_TIMEOUT_MS, ONLYFANS_BASE_URL, HEADLESS, STORAGE_KEY } from './config.js'
import { loadStorageState, saveStorageState, clearStorage } from './storage.js'
import { FlowError, ErrorCodes } from './errors.js'

/** @type {{ browser: import('playwright').Browser, context: import('playwright').BrowserContext } | null} */
let state = null

async function prompt(message) {
  const rl = readline.createInterface({ input, output })
  const answer = await rl.question(`${message}\nPress Enter when done...`)
  rl.close()
  return answer
}

async function buildContext(browser, storageState) {
  if (storageState) {
    return browser.newContext({ storageState })
  }
  return browser.newContext()
}

async function performInteractiveLogin(context) {
  const page = await context.newPage()
  await page.goto(ONLYFANS_BASE_URL, { waitUntil: 'domcontentloaded' })
  // Provide console instructions for the creator
  // eslint-disable-next-line no-console
  console.log('\n[BYO-IP] Login required. A browser window may open.\n' +
    'Complete login (including 2FA) in the Playwright-controlled window.\n' +
    'This step will auto-continue once login is detected (no Enter key needed).\n')

  try {
    await page.waitForFunction(() => document.cookie.includes('auth_id'), { timeout: LOGIN_TIMEOUT_MS })
  } catch {
    throw new FlowError(ErrorCodes.LOGIN_REQUIRED, 'Timed out waiting for OnlyFans login confirmation', {
      retryable: false
    })
  } finally {
    await page.close()
  }
  // Persist only if master key provided
  if (STORAGE_KEY) {
    const storageState = await context.storageState()
    await saveStorageState(storageState)
  }
}

export async function getAuthenticatedContext() {
  if (state?.context && !state.context.isClosed()) {
    return state.context
  }

  const browser = state?.browser && state.browser.isConnected()
    ? state.browser
    : await chromium.launch({ headless: HEADLESS })

  let storageState = null
  if (STORAGE_KEY) {
    try {
      storageState = await loadStorageState()
    } catch (err) {
      // ignore missing/invalid storage: we will re-login
    }
  }

  const context = await buildContext(browser, storageState)

  if (!storageState) {
    await performInteractiveLogin(context)
  }

  state = { browser, context }
  return context
}

export async function invalidateContext({ clear = false } = {}) {
  if (state?.context && !state.context.isClosed()) {
    await state.context.close().catch(() => {})
  }
  if (state?.browser && state.browser.isConnected()) {
    await state.browser.close().catch(() => {})
  }
  state = null
  if (clear) await clearStorage()
}

export async function withAuthenticatedPage(fn) {
  const context = await getAuthenticatedContext()
  const page = await context.newPage()
  try {
    return await fn(page)
  } finally {
    await page.close().catch(() => {})
  }
}
