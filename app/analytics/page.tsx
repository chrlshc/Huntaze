import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type Summary = {
  rangeDays: number
  totalEvents: number
  clicks: number
  publish: number
  stat_snapshots: number
  perPlatform: Record<string, { clicks: number; publish: number; stat_snapshots: number }>
}

function originFromHeaders(h: Headers) {
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

function fmt(n: number) { return new Intl.NumberFormat().format(n) }

async function getSummary(baseUrl: string, since: string): Promise<Summary> {
  const res = await fetch(`${baseUrl}/api/analytics/summary?since=${encodeURIComponent(since)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load summary: ${res.status}`)
  return res.json()
}

export default async function AnalyticsOverviewPage({ searchParams }: { searchParams?: { since?: string } }) {
  const h = headers()
  const base = originFromHeaders(h)
  const since = (searchParams?.since || '7d').trim()
  const summary = await getSummary(base, since)

  const kpis = [
    { label: 'Clicks', value: summary.clicks },
    { label: 'Publishes', value: summary.publish },
    { label: 'Stat snapshots', value: summary.stat_snapshots },
  ]

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Période :</span>
          <div className="inline-flex rounded-lg border overflow-hidden">
            {['24h','7d','14d','30d'].map(r => (
              <a key={r} href={`?since=${r}`} className={`px-3 py-1.5 hover:bg-gray-50 ${since===r?'bg-gray-100 font-medium':''}`}>{r}</a>
            ))}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="rounded-lg border p-4">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="text-2xl font-bold">{fmt(k.value)}</div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Par plateforme (depuis {since}, jours chargés: {summary.rangeDays})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(summary.perPlatform).map(([platform, v]) => (
            <div key={platform} className="rounded-lg border p-4">
              <div className="font-medium mb-2">{platform}</div>
              <div className="text-sm space-y-1">
                <div>Clicks : <b>{fmt(v.clicks)}</b></div>
                <div>Publishes : <b>{fmt(v.publish)}</b></div>
                <div>Snapshots : <b>{fmt(v.stat_snapshots)}</b></div>
              </div>
            </div>
          ))}
          {Object.keys(summary.perPlatform).length === 0 && (
            <div className="rounded-lg border p-4 text-sm text-gray-500">Aucune donnée pour cette période.</div>
          )}
        </div>
      </section>
    </main>
  )
}
