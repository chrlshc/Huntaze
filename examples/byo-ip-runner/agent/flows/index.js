import { sendDirectMessage } from './sendDm.js'
import { scrapeSubscribers } from './scrapeSubs.js'
import { broadcastDm } from './broadcastDm.js'
import { schedulePost } from './schedulePost.js'
import { scrapeMessages } from './scrapeMessages.js'
import { checkNotifications } from './checkNotifications.js'

export const flowHandlers = {
  send_dm: sendDirectMessage,
  broadcast_dm: async (context, payload, logger) => broadcastDm(context, payload, logger),
  schedule_post: async (context, payload, logger) => schedulePost(context, payload, logger),
  scrape_subs: scrapeSubscribers,
  scrape_messages: async (context, payload, logger) => scrapeMessages(context, payload, logger),
  check_notifications: async (context, payload, logger) => checkNotifications(context, payload, logger)
}
