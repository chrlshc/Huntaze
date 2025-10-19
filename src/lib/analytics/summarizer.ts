import { getRedis } from '@/src/lib/redis'
import { callAzureOpenAI } from '@/src/lib/ai/providers/azure'
import { insertInsightSummary } from '@/src/lib/db/summaryRepo'
import { outboxInsert } from '@/src/lib/db/outboxRepo'
import { prom } from '@/src/lib/prom'

type Platform = 'instagram' | 'tiktok'

function toSec(ms: number) { return Math.floor(ms / 1000) }

async function fetchIgSnapshots(accountId: string, fromSec: number, toSec: number) {
  const r = getRedis()
  const ids = await r.smembers('ig:insights:track')
  const items: Array<{ id: string; views?: number; reach?: number; saved?: number; engagement?: number }> = []
  for (const id of ids || []) {
    const key = `ig:insights:media:${id}:ts`
    const vals = await r.zrangebyscore(key, String(fromSec), String(toSec))
    for (const v of vals) {
      try {
        const obj = JSON.parse(v)
        const snap = obj?.snapshot || obj
        items.push({ id, views: snap?.views, reach: snap?.reach, saved: snap?.saved, engagement: snap?.engagement })
      } catch {}
    }
  }
  return items
}

async function fetchTtSnapshots(accountId: string, fromSec: number, toSec: number) {
  const r = getRedis()
  const ids = await r.smembers('tiktok:insights:track')
  const items: Array<{ id: string; views?: number; likes?: number; comments?: number; shares?: number }> = []
  for (const id of ids || []) {
    const key = `tiktok:insights:video:${id}:ts`
    const vals = await r.zrangebyscore(key, String(fromSec), String(toSec))
    for (const v of vals) {
      try {
        const obj = JSON.parse(v)
        items.push({ id, views: obj?.views, likes: obj?.likes, comments: obj?.comments, shares: obj?.shares })
      } catch {}
    }
  }
  return items
}

function aggregateIg(items: Array<{ id: string; views?: number; reach?: number; saved?: number; engagement?: number }>) {
  let totalViews = 0, totalReach = 0, totalSaved = 0, totalEng = 0
  const byPost = new Map<string, { id: string; views: number }>()
  for (const it of items) {
    totalViews += Number(it.views || 0)
    totalReach += Number(it.reach || 0)
    totalSaved += Number(it.saved || 0)
    totalEng += Number(it.engagement || 0)
    const cur = byPost.get(it.id) || { id: it.id, views: 0 }
    cur.views += Number(it.views || 0)
    byPost.set(it.id, cur)
  }
  const top = Array.from(byPost.values()).sort((a,b)=>b.views-a.views).slice(0,3)
  return { totalViews, totalReach, totalSaved, totalEng, top }
}

function aggregateTt(items: Array<{ id: string; views?: number; likes?: number; comments?: number; shares?: number }>) {
  let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0
  const byPost = new Map<string, { id: string; views: number }>()
  for (const it of items) {
    totalViews += Number(it.views || 0)
    totalLikes += Number(it.likes || 0)
    totalComments += Number(it.comments || 0)
    totalShares += Number(it.shares || 0)
    const cur = byPost.get(it.id) || { id: it.id, views: 0 }
    cur.views += Number(it.views || 0)
    byPost.set(it.id, cur)
  }
  const top = Array.from(byPost.values()).sort((a,b)=>b.views-a.views).slice(0,3)
  return { totalViews, totalLikes, totalComments, totalShares, top }
}

export async function runAiInsightsSummarizer(opts: { accountId: string; period: '1d'|'7d'|'28d'; platform: Platform }) {
  const started = Date.now()
  const platform = opts.platform
  const nowSec = toSec(Date.now())
  const durMap: Record<string, number> = { '1d': 86400, '7d': 7*86400, '28d':28*86400 }
  const fromSec = nowSec - (durMap[opts.period] || 7*86400)

  try {
    let summary: any = {}
    if (platform === 'instagram') {
      const items = await fetchIgSnapshots(opts.accountId, fromSec, nowSec)
      const ag = aggregateIg(items)
      const sys = 'You are an analytics assistant. Return STRICT JSON with keys: period, kpis, top_posts, failures, recommendations.'
      const user = `Summarize Instagram metrics for last ${opts.period}. totals: views=${ag.totalViews}, reach=${ag.totalReach}, saved=${ag.totalSaved}, engagement=${ag.totalEng}. Top posts=${ag.top.map(t=>t.id+':'+t.views).join(',')}`
      const llm = await callAzureOpenAI({ messages: [{role:'system',content:sys},{role:'user',content:user}], maxTokens: 400, temperature: 0.2 })
      const txt = String(llm.content||'')
      const jstart = txt.indexOf('{'); const jend = txt.lastIndexOf('}')
      if (jstart>=0 && jend>jstart) summary = JSON.parse(txt.slice(jstart,jend+1))
      if (!summary?.kpis) summary = { period: opts.period, kpis: { views: ag.totalViews, reach: ag.totalReach }, top_posts: ag.top, failures: [], recommendations: [] }
    } else if (platform === 'tiktok') {
      const items = await fetchTtSnapshots(opts.accountId, fromSec, nowSec)
      const ag = aggregateTt(items)
      const sys = 'You are an analytics assistant. Return STRICT JSON with keys: period, kpis, top_posts, failures, recommendations.'
      const user = `Summarize TikTok metrics for last ${opts.period}. totals: views=${ag.totalViews}, likes=${ag.totalLikes}, comments=${ag.totalComments}, shares=${ag.totalShares}. Top posts=${ag.top.map(t=>t.id+':'+t.views).join(',')}`
      const llm = await callAzureOpenAI({ messages: [{role:'system',content:sys},{role:'user',content:user}], maxTokens: 400, temperature: 0.2 })
      const txt = String(llm.content||'')
      const jstart = txt.indexOf('{'); const jend = txt.lastIndexOf('}')
      if (jstart>=0 && jend>jstart) summary = JSON.parse(txt.slice(jstart,jend+1))
      if (!summary?.kpis) summary = { period: opts.period, kpis: { views: ag.totalViews, likes: ag.totalLikes }, top_posts: ag.top, failures: [], recommendations: [] }
    }

    await insertInsightSummary({ platform, accountId: opts.accountId, period: opts.period, summary })
    try {
      console.log(JSON.stringify({
        level: 'info',
        event: 'insight_ready',
        platform,
        accountId: opts.accountId,
        period: opts.period,
        timestamp: new Date().toISOString(),
      }))
    } catch {}
    await outboxInsert({ aggregateType: 'insight_summary', aggregateId: `${opts.accountId}:${opts.period}:${platform}`, eventType: 'AI_INSIGHTS_READY', payload: { account_id: opts.accountId, platform, period: opts.period } })
    prom.counters.aiSummaryJobs.labels({ platform, status: 'success' as any }).inc(1)
    prom.histograms.aiSummaryLatency.labels({ platform }).observe((Date.now()-started)/1000)
    return { ok: true }
  } catch (e: any) {
    prom.counters.aiSummaryJobs.labels({ platform, status: 'error' as any }).inc(1)
    prom.counters.aiSummaryErrors.labels({ platform, reason: e?.name || 'error' }).inc(1)
    throw e
  }
}
