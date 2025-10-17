import PageHeader from '@/components/PageHeader'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

async function getHealth() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const url = `${baseUrl}/api/ops/health`
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return await r.json()
  } catch {
    // fallback to relative fetch (local/dev)
    const r = await fetch('/api/ops/health', { cache: 'no-store' })
    return await r.json()
  }
}

function KVP({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <Badge variant={ok ? 'success' : 'outline'}>{label || (ok ? 'OK' : 'Missing')}</Badge>
  )
}

function Counts({ counts }: { counts: Record<string, number> }) {
  const keys = Object.keys(counts || {})
  if (!keys.length) return <div className="text-sm text-muted-foreground">No events in window</div>
  return (
    <div className="grid grid-cols-2 gap-2">
      {keys.map((k) => (
        <div key={k} className="flex items-center justify-between text-sm border rounded px-2 py-1">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium">{counts[k]}</span>
        </div>
      ))}
    </div>
  )
}

function SSEProbe() {
  return (
    <div className="text-sm" suppressHydrationWarning>
      <SSEClient />
    </div>
  )
}

function SSEClient() {
  // Client-only via dynamic import pattern
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(){
            var el = document.currentScript.parentElement;
            var span = document.createElement('span');
            span.textContent = 'Connecting...';
            el.appendChild(span);
            try {
              var src = '/api/analytics/stream?since=6h';
              var es = new EventSource(src);
              var last;
              es.onmessage = function(ev){ last = new Date().toISOString(); span.textContent = 'Live OK ('+ last +')'; };
              es.onerror = function(){ span.textContent = 'SSE error'; };
            } catch (e) { span.textContent = 'SSE init failed'; }
          })();
        `,
      }}
    />
  )
}

export default async function OpsHealthPage() {
  if (process.env.OPS_UI_ENABLED !== 'true') {
    notFound()
  }
  const data = await getHealth()
  const ttlOk = data?.tables?.analytics?.ttl?.status === 'ENABLED' && data?.tables?.analytics?.ttl?.attribute === 'ttl'
  const analyticsOk = !!data?.tables?.analytics?.exists
  const tokensOk = !!data?.tables?.tokens?.exists
  const sqs = data?.sqs || {}

  return (
    <div className="space-y-6">
      <PageHeader title="Ops Health" description="Status of analytics, tokens, publishers and live metrics." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>DynamoDB</CardTitle>
            <CardDescription>Tables and TTL status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <KVP label="Region" value={data?.region || '-'} />
            <KVP label="Analytics table" value={data?.tables?.analytics?.name || '-'} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analytics exists</span>
              <StatusBadge ok={analyticsOk} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TTL enabled (ttl)</span>
              <StatusBadge ok={ttlOk} />
            </div>
            <KVP label="Tokens table" value={data?.tables?.tokens?.name || '-'} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tokens exists</span>
              <StatusBadge ok={tokensOk} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishers (SQS URLs)</CardTitle>
            <CardDescription>Scheduler routing (no OF autopost)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Instagram</span>
              <StatusBadge ok={!!sqs.instagram?.present} label={sqs.instagram?.present ? 'Set' : 'Missing'} />
            </div>
            <div className="truncate text-xs text-muted-foreground">{sqs.instagram?.url || '-'}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TikTok</span>
              <StatusBadge ok={!!sqs.tiktok?.present} label={sqs.tiktok?.present ? 'Set' : 'Missing'} />
            </div>
            <div className="truncate text-xs text-muted-foreground">{sqs.tiktok?.url || '-'}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reddit</span>
              <StatusBadge ok={!!sqs.reddit?.present} label={sqs.reddit?.present ? 'Set' : 'Missing'} />
            </div>
            <div className="truncate text-xs text-muted-foreground">{sqs.reddit?.url || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events (24h)</CardTitle>
            <CardDescription>token_refresh, manual_task, schedule_request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Counts counts={data?.recent?.counts || {}} />
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">SSE Live:</div>
              <SSEProbe />
            </div>
            <div className="pt-2">
              <a href="/api/ops/health" target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">Open JSON</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
