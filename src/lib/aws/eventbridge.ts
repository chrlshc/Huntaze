import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'

let _client: EventBridgeClient | null = null
function getClient() { return _client || (_client = new EventBridgeClient({})) }

export async function putEvent(detailType: string, detail: any, source = 'app.ai-team') {
  const enabled = String(process.env.ENABLE_EVENTBRIDGE_HOOKS || '').toLowerCase()
  if (!(enabled === '1' || enabled === 'true' || enabled === 'yes' || enabled === 'on')) return
  const entry = { Source: source, DetailType: detailType, Detail: JSON.stringify(detail) }
  const size = Buffer.byteLength(JSON.stringify(entry), 'utf8')
  if (size >= 256 * 1024) throw new Error('PutEvents entry too large (>=256KB)')
  await getClient().send(new PutEventsCommand({ Entries: [entry] }))
}

