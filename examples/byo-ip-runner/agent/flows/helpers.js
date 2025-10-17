import { ONLYFANS_BASE_URL } from '../lib/config.js'
import { FlowError, ErrorCodes } from '../lib/errors.js'

export async function ensureOnPage(page, path) {
  const url = new URL(path, ONLYFANS_BASE_URL).toString()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('/login')) {
    throw new FlowError(ErrorCodes.LOGIN_REQUIRED, 'OnlyFans redirected to login', { retryable: false })
  }
}

export async function typeHuman(locator, text) {
  for (const chunk of text.split(/\s+/)) {
    await locator.type(`${chunk} `, { delay: 40 + Math.random() * 60 })
  }
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomDelay(min = 200, max = 600) {
  return sleep(Math.floor(Math.random() * (max - min + 1)) + min)
}

