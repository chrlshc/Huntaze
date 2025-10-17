import { FlowError, ErrorCodes, buildSuccess } from '../lib/errors.js'
import { ensureOnPage, typeHuman, randomDelay } from './helpers.js'

const SEARCH_SELECTOR = 'input[placeholder*="Search" i], input[type="search"]'
const MESSAGE_EDITOR_SELECTOR = '[contenteditable="true"], textarea'
const CHAT_ROW_SELECTOR = '[data-testid*="chat"], [class*="chatListItem" i], [role="listitem"]'

export async function sendDirectMessage(context, payload, logger) {
  if (!payload || !payload.recipient) {
    throw new FlowError(ErrorCodes.BAD_REQUEST, 'recipient missing in payload', { retryable: false })
  }
  if (!payload.text) {
    throw new FlowError(ErrorCodes.BAD_REQUEST, 'text missing in payload', { retryable: false })
  }

  const page = await context.newPage()
  try {
    await ensureOnPage(page, '/my/chats')
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    const search = page.locator(SEARCH_SELECTOR).first()
    if (!(await search.count())) {
      throw new FlowError(ErrorCodes.SELECTOR_MISSING, 'Inbox search input not found', { retryable: true })
    }

    await search.fill('')
    await typeHuman(search, payload.recipient)
    await randomDelay()

    const chatRow = page.locator(`${CHAT_ROW_SELECTOR}:has-text("${payload.recipient}")`).first()
    if (!(await chatRow.count())) {
      throw new FlowError(ErrorCodes.TARGET_NOT_FOUND, `Could not locate conversation for ${payload.recipient}`, { retryable: false })
    }

    await chatRow.click({ timeout: 10000 })
    await randomDelay(400, 900)

    const editor = page.locator(MESSAGE_EDITOR_SELECTOR).last()
    if (!(await editor.count())) {
      throw new FlowError(ErrorCodes.SELECTOR_MISSING, 'Message input editor not found', { retryable: true })
    }

    await editor.click()
    await editor.fill('')
    await typeHuman(editor, payload.text)
    await randomDelay(300, 600)
    await editor.press('Enter')

    await page.waitForTimeout(1200)
    logger('info', { event: 'dm_sent', recipient: payload.recipient })
    return buildSuccess({ dm_sent: 1 })
  } catch (err) {
    throw err
  } finally {
    await page.close().catch(() => {})
  }
}

