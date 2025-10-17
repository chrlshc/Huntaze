import { FlowError, ErrorCodes, buildSuccess } from '../lib/errors.js'
import { ensureOnPage, randomDelay } from './helpers.js'

const FAN_CARD_SELECTOR = '[data-testid*="fan-card"], [class*="SubscriberCard" i], article'

async function extractFanData(card) {
  const username = await card.locator('[data-testid="fan-username"], [class*="username" i]').first().textContent().catch(() => null)
  const displayName = await card.locator('[data-testid="fan-display-name"], [class*="displayName" i]').first().textContent().catch(() => null)
  const renewal = await card.locator('text=/renew/i').first().textContent().catch(() => null)
  const joined = await card.locator('text=/joined/i').first().textContent().catch(() => null)
  return {
    username: username?.trim() || null,
    displayName: displayName?.trim() || null,
    renewal: renewal?.trim() || null,
    joined: joined?.trim() || null
  }
}

export async function scrapeSubscribers(context, payload = {}, logger) {
  const maxFans = Number(payload.limit || 200)
  const page = await context.newPage()
  const subscribers = []
  try {
    await ensureOnPage(page, '/my/fans')
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    let retry = 0
    while (subscribers.length < maxFans) {
      const cards = await page.locator(FAN_CARD_SELECTOR).elementHandles()
      if (!cards.length) {
        retry += 1
        if (retry >= 3) break
        await randomDelay(500, 1200)
        continue
      }

      for (const card of cards) {
        const fan = await extractFanData(card)
        if (fan.username && !subscribers.some((f) => f.username === fan.username)) {
          subscribers.push(fan)
        }
        if (subscribers.length >= maxFans) break
      }

      const before = subscribers.length
      await page.mouse.wheel(0, 800)
      await randomDelay(400, 900)
      if (subscribers.length === before) {
        retry += 1
        if (retry >= 2) break
      } else {
        retry = 0
      }
    }

    logger('info', { event: 'scrape_subs_complete', count: subscribers.length })
    return buildSuccess({ subscribers })
  } catch (err) {
    if (err instanceof FlowError) throw err
    throw new FlowError(ErrorCodes.UNKNOWN, err.message || 'Failed to scrape subscribers', { retryable: true })
  } finally {
    await page.close().catch(() => {})
  }
}

