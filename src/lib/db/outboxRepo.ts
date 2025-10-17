import { query } from '@/src/lib/db/pg'

export async function outboxInsert(opts: { aggregateType: string; aggregateId: string; eventType: string; payload: any }) {
  await query('insert into events_outbox (aggregate_type, aggregate_id, event_type, payload) values ($1,$2,$3,$4)', [opts.aggregateType, opts.aggregateId, opts.eventType, JSON.stringify(opts.payload)])
}

export async function outboxFetchUnsent(limit = 50) {
  const r = await query('select * from events_outbox where sent_at is null order by id asc limit $1', [limit])
  return r.rows
}

export async function outboxMarkSent(id: number) {
  await query('update events_outbox set sent_at = now() where id = $1', [id])
}

