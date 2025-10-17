import { sleep, jitter } from '../lib/util.js'
import { FlowError, ErrorCodes, buildSuccess } from '../lib/errors.js'
import { sendDirectMessage } from './sendDm.js'
import * as ckpt from '../lib/ckpt.js'

export async function broadcastDm(context, payload, logger) {
  const { recipients, text, tempo = { min_ms: 3000, jitter_ms: 1500 }, idem_key } = payload || {}
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new FlowError(ErrorCodes.BAD_REQUEST, 'recipients array missing', { retryable: false })
  }
  if (!text) {
    throw new FlowError(ErrorCodes.BAD_REQUEST, 'text missing', { retryable: false })
  }

  let start = 0
  if (idem_key) {
    const v = await ckpt.load(idem_key)
    if (Number.isFinite(v)) start = Number(v)
  }

  let sent = 0
  for (let i = start; i < recipients.length; i += 1) {
    const r = recipients[i]
    try {
      await sendDirectMessage(context, { recipient: r, text }, logger)
      sent += 1
      if (idem_key) await ckpt.save(idem_key, i + 1)
      await sleep(jitter(tempo.min_ms || 3000, tempo.jitter_ms || 0))
    } catch (err) {
      // Best-effort retryable path handled at jobRunner level
      throw err
    }
  }

  logger('info', { event: 'broadcast_complete', sent })
  return buildSuccess({ sent })
}

