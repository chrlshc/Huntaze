import { FlowError, ErrorCodes, buildSuccess } from '../lib/errors.js'
import { ensureOnPage, randomDelay } from './helpers.js'

// Heuristic selectors (OnlyFans UI varies; adjust during headful tuning)
const THREAD_ROW = '[data-testid*="chat"], [role="listitem"], [class*="chatListItem" i]'
const MESSAGE_BUBBLE = '[data-testid*="message"], [class*="message" i]'

async function extractThreadMeta(page) {
  // Try to get username/title in the thread header
  const title = await page.locator('[data-testid*="thread-title"], header [class*=title i], h1,h2').first().textContent().catch(() => null)
  return { title: title?.trim() || null }
}

async function extractMessages(page, limitMsgs) {
  const bubbles = await page.locator(MESSAGE_BUBBLE).elementHandles()
  const keep = bubbles.slice(Math.max(0, bubbles.length - limitMsgs))
  const items = []
  for (const b of keep) {
    const text = (await b.evaluate((el) => el.textContent || ''))?.trim() || ''
    // Direction heuristic: could look at CSS classes for outgoing/incoming
    const cls = await b.evaluate((el) => el.getAttribute('class') || '')
    const dir = /out|mine|sent/i.test(cls) ? 'out' : 'in'
    items.push({ id: null, ts: null, dir, text })
  }
  return items
}

export async function scrapeMessages(context, payload = {}, logger) {
  const sinceTs = Number(payload.since_ts || 0)
  const limitThreads = Math.max(1, Number(payload.limit_threads || 20))
  const limitMsgs = Math.max(1, Number(payload.limit_msgs || 30))

  const page = await context.newPage()
  try {
    await ensureOnPage(page, '/my/chats')
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    const threads = []
    const rows = await page.locator(THREAD_ROW).elementHandles()
    for (let i = 0; i < Math.min(rows.length, limitThreads); i += 1) {
      await rows[i].click({ timeout: 10000 })
      await randomDelay(250, 600)

      const meta = await extractThreadMeta(page)
      const msgs = await extractMessages(page, limitMsgs)
      // since_ts filter (heuristic: we don't parse timestamps here; keep all)
      threads.push({ thread_id: null, peer: { username: meta.title }, msgs })
    }

    logger('info', { event: 'scrape_messages_complete', threads: threads.length })
    return buildSuccess({ threads })
  } catch (err) {
    if (err instanceof FlowError) throw err
    throw new FlowError(ErrorCodes.UNKNOWN, err.message || 'Failed to scrape messages', { retryable: true })
  } finally {
    await page.close().catch(() => {})
  }
}

