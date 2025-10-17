import { FlowError, ErrorCodes, buildSuccess } from '../lib/errors.js'
import { ensureOnPage } from './helpers.js'

export async function schedulePost(context, payload, logger) {
  const { text, media = [], scheduled_at, tz } = payload || {}
  if (!scheduled_at) {
    throw new FlowError(ErrorCodes.BAD_REQUEST, 'scheduled_at missing', { retryable: false })
  }
  const page = await context.newPage()
  try {
    await ensureOnPage(page, '/my/posts/new')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

    if (Array.isArray(media) && media.length > 0) {
      const input = page.getByLabel(/upload|media/i).first()
      if (await input.isVisible().catch(() => false)) {
        await input.setInputFiles(media.map((m) => m.path))
      }
    }
    if (text) {
      const editor = page.getByRole('textbox').first()
      if (await editor.isVisible().catch(() => false)) {
        await editor.fill(text)
      }
    }

    const scheduleBtn = page.getByRole('button', { name: /schedule/i })
    if (!(await scheduleBtn.isVisible().catch(() => false))) {
      throw new FlowError(ErrorCodes.SELECTOR_MISSING, 'Schedule button not found', { retryable: true })
    }
    await scheduleBtn.click()

    // naive datetime fill: rely on inputs labeled Date/Time
    const dateBox = page.getByRole('textbox', { name: /date/i }).first()
    const timeBox = page.getByRole('textbox', { name: /time/i }).first()
    const d = new Date(scheduled_at)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const HH = String(d.getUTCHours()).padStart(2, '0')
    const MM = String(d.getUTCMinutes()).padStart(2, '0')

    if (await dateBox.isVisible().catch(() => false)) await dateBox.fill(`${yyyy}-${mm}-${dd}`)
    if (await timeBox.isVisible().catch(() => false)) await timeBox.fill(`${HH}:${MM}`)

    const confirm = page.getByRole('button', { name: /^schedule$/i })
    if (await confirm.isVisible().catch(() => false)) await confirm.click()

    // await a POST to posts, best-effort
    await page.waitForResponse((r) => r.request().method() === 'POST' && /posts/.test(r.url()), { timeout: 30000 }).catch(() => null)
    logger('info', { event: 'scheduled', at: scheduled_at })
    return buildSuccess({ scheduled_at })
  } finally {
    await page.close().catch(() => {})
  }
}

