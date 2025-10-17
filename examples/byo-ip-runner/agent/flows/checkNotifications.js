import crypto from 'crypto'
import * as ckpt from '../lib/ckpt.js'
import { FlowError, ErrorCodes, buildSuccess } from '../lib/errors.js'

export function hash(str) {
  return crypto.createHash('sha256').update(String(str)).digest('hex')
}

export async function checkNotifications(context, payload = {}, logger) {
  const sinceId = String(payload.since_id || '')
  const ckptKey = 'notif_latest_id'
  const page = await context.newPage()
  try {
    // Navigate to a notifications page or open the bell
    await page.goto('https://onlyfans.com/my/notifications', { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    // Heuristic selectors for notification items
    const items = page.locator('[data-testid*="notification"], li, article').first().locator('xpath=..')
    const handles = await page.locator('[data-testid*="notification"], li, article').elementHandles()
    const out = []
    for (const h of handles) {
      const text = (await h.evaluate((el) => el.textContent || ''))?.trim() || ''
      if (!text) continue
      const id = hash(text)
      out.push({ id, text })
    }

    // Dedupe with sinceId or ckpt
    let latestId = await ckpt.load(ckptKey)
    const fresh = out
    if (sinceId) {
      // drop items until sinceId encountered
      const idx = fresh.findIndex((x) => x.id === sinceId)
      if (idx >= 0) fresh.splice(idx)
    }

    if (fresh[0]?.id) await ckpt.save(ckptKey, fresh[0].id)

    logger('info', { event: 'check_notifications', count: fresh.length })
    return buildSuccess({ notifications: fresh, last_id: fresh[0]?.id || null })
  } catch (err) {
    if (err instanceof FlowError) throw err
    throw new FlowError(ErrorCodes.UNKNOWN, err.message || 'Failed to check notifications', { retryable: true })
  } finally {
    await page.close().catch(() => {})
  }
}
