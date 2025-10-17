import { NextRequest, NextResponse } from 'next/server'

type Segment = { name: string; rules?: Record<string, unknown> }
type Variant = { id: string; text: string; price?: number }

function makeBatches(total: number, batchSize: number) {
  const out: Array<{ index: number; count: number; window: string }> = []
  let left = total
  let i = 0
  const now = new Date()
  while (left > 0) {
    const count = Math.min(batchSize, left)
    const window = new Date(now.getTime() + i * 20 * 60 * 1000).toISOString() // 20m apart
    out.push({ index: i, count, window })
    left -= count
    i++
  }
  return out
}

function buildCsv(variant: Variant, utm: { source: string; medium: string; campaign: string }) {
  const header = 'variant_id,text,utm_source,utm_medium,utm_campaign\n'
  const line = `${variant.id},"${variant.text.replace(/"/g, '""')}",${utm.source},${utm.medium},${utm.campaign}\n`
  return header + line
}

export async function POST(req: NextRequest) {
  try {
    const { segment, variants, price } = await req.json() as { segment: Segment; variants: Variant[]; price?: number }
    if (!segment || !variants?.length) return NextResponse.json({ error: 'Missing segment or variants' }, { status: 400 })

    const estSize = segment?.rules?.estimatedCount || 500
    const batches = makeBatches(estSize, 100)
    const utm = { source: 'onlyfans', medium: 'campaign', campaign: segment.name.replace(/\s+/g, '_').toLowerCase() }
    const csv = buildCsv(variants[0], utm)

    return NextResponse.json({
      mode: 'human_in_the_loop',
      plan: {
        segment,
        price,
        batches,
        ab: variants.map(v => ({ id: v.id, metric: 'ctr' })),
        utm,
        deepLink: 'https://onlyfans.com/my/messages/new',
      },
      csvSample: csv,
      instructions: [
        'Copy the CSV row into your clipboard',
        'Open the OF broadcast composer',
        'Paste the message and set the PPV price',
        'Send batches with 20min spacing to respect rate limits',
      ],
      disclaimer: 'No automated sending — user must press send in OF UI.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to build plan', details: message }, { status: 500 })
  }
}
