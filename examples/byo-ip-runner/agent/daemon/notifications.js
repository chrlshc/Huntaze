import * as ckpt from '../lib/ckpt.js'
import { checkNotifications } from '../flows/checkNotifications.js'

const MOCK_NOTIFS = /^true$/i.test(process.env.BYO_AGENT_MOCK || '')

export function startNotificationsPoller(ctx) {
  if (!/^true$/i.test(process.env.BYO_AGENT_POLL_NOTIFS || '')) return { stop: () => {} }

  const base = Number(process.env.BYO_AGENT_POLL_NOTIFS_INTERVAL_MS || 15 * 60 * 1000)
  const jitter = Math.min(base * 0.2, 60_000)
  let stopped = false
  let timer = null

  const loop = async () => {
    if (stopped) return
    try {
      if (MOCK_NOTIFS) {
        const data = {
          notifications: [
            { id: String(Date.now()), text: 'Mock notification: BYO_AGENT_MOCK=true' }
          ],
          last_id: String(Date.now())
        }
        ctx.wsSend({
          t: 'notify',
          kind: 'check_notifications',
          agentId: ctx.agentId,
          creatorId: process.env.BYO_CREATOR_ID || null,
          data,
        })
        ctx.log('notifs_mock_sent', { count: data.notifications.length })
        // no ckpt update in mock
        const next = base + Math.floor(Math.random() * (jitter + 1))
        timer = setTimeout(loop, next)
        return
      }
      // Suppression window when an explicit check_notifications job is assigned
      const now = Date.now()
      if (typeof ctx.getSuppressUntil === 'function') {
        const sup = Number(ctx.getSuppressUntil() || 0)
        if (now < sup) {
          const wait = Math.min(base, sup - now)
          ctx.log('notifs_poll_suppressed', { ms: wait })
          timer = setTimeout(loop, wait)
          return
        }
      }
      const sinceId = (await ckpt.load('notifs_since_id')) || ''
      const res = await checkNotifications(await ctx.getContext(), { since_id: sinceId }, (lvl, data) => ctx.log('notifs', { lvl, ...data }))

      const data = res?.payload || {}
      ctx.wsSend({
        t: 'notify',
        kind: 'check_notifications',
        agentId: ctx.agentId,
        creatorId: process.env.BYO_CREATOR_ID || null,
        data,
      })
      const latest = data.last_id || (data.notifications && data.notifications[0]?.id)
      if (latest) await ckpt.save('notifs_since_id', latest)
    } catch (e) {
      ctx.log('notifs_poll_error', { code: e.code || 'UNKNOWN', msg: e.message })
    } finally {
      const next = base + Math.floor(Math.random() * (jitter + 1))
      timer = setTimeout(loop, next)
    }
  }

  timer = setTimeout(loop, 5_000)
  return { stop: () => { stopped = true; if (timer) clearTimeout(timer) } }
}
