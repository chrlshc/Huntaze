'use client'

import { useMemo, type ComponentType } from 'react'
import {
  Award,
  Flame,
  BellRing,
  Activity,
  Users,
  ArrowUpRight,
  Brain,
  AlarmClock,
  BarChart2,
} from 'lucide-react'

import type { DashboardStats } from '@/hooks/useData'
import type { EfficiencyFan } from '@/components/creator/CreatorEfficiencySuite'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface EnhancedFanCRMProps {
  fans?: EfficiencyFan[]
  stats?: DashboardStats | null
  loading?: boolean
}

interface CampaignIdea {
  id: string
  title: string
  segment: string
  cadence: string
  projectedLift: number
}

const retentionIdeas: CampaignIdea[] = [
  {
    id: 'vip-surprise',
    title: 'VIP surprise drop',
    segment: 'VIP',
    cadence: 'Weekly',
    projectedLift: 22,
  },
  {
    id: 'whale-appreciation',
    title: 'Whale appreciation night',
    segment: 'Whales',
    cadence: 'Monthly',
    projectedLift: 31,
  },
  {
    id: 'sleepers-revive',
    title: 'Win-back spark',
    segment: 'Sleeping fans',
    cadence: 'Bi-weekly',
    projectedLift: 17,
  },
]

export function EnhancedFanCRM({ fans, stats, loading }: EnhancedFanCRMProps) {
  const totals = useMemo(() => {
    if (!fans || fans.length === 0) {
      return {
        vip: 0,
        whales: 0,
        sleepers: 0,
        priorityQueue: [] as Array<EfficiencyFan & { score: number }>,
        ltv: 0,
      }
    }

    const vip = fans.filter((fan) => (fan.fanTier || '').toLowerCase() === 'vip').length
    const whales = fans.filter((fan) => fan.totalSpent >= 250).length
    const sleepers = fans.filter((fan) => (fan.daysSincePurchase ?? 0) > 21).length

    const sorted: Array<EfficiencyFan & { score: number }> = [...fans]
      .map((fan) => ({
        ...fan,
        score: Math.round((fan.totalSpent || 0) * 0.6 + (fan.daysSincePurchase ?? 0) * -1 + (fan.status === 'Active' ? 10 : 4)),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    const ltv = fans.reduce((acc, fan) => acc + fan.totalSpent, 0) / Math.max(fans.length, 1)

    return { vip, whales, sleepers, priorityQueue: sorted, ltv }
  }, [fans])

  const revenueHealth = useMemo(() => {
    const avg = stats?.avgRevenuePerFan ?? totals.ltv
    const churnRisk = stats ? Math.max(0, 100 - stats.engagementRate) / 10 : 6
    return {
      avg,
      churnRisk: Math.min(100, churnRisk * 9),
      winBackGoal: Math.round(Math.max(avg * 0.2, 18)),
    }
  }, [stats, totals.ltv])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <CardTitle>Segmentation spotlight</CardTitle>
          </div>
          <CardDescription>High-impact segments that determine your monthly revenue curve.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <SegmentMetric label="VIP" count={totals.vip} helper="High-touch members" icon={Award} tone="emerald" />
          <SegmentMetric label="Whales" count={totals.whales} helper=">$250 lifetime" icon={Flame} tone="amber" />
          <SegmentMetric label="Sleeping" count={totals.sleepers} helper=">21d silent" icon={AlarmClock} tone="rose" />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-500" />
            <CardTitle>Revenue health</CardTitle>
          </div>
          <CardDescription>Track lifetime value, churn risk, and immediate win-back focus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-medium text-slate-800">
              <span>Average LTV</span>
              <span>${Math.round(revenueHealth.avg).toLocaleString()}</span>
            </div>
            <Progress value={Math.min(100, (revenueHealth.avg / 250) * 100)} className="mt-2" />
            <p className="text-xs text-slate-500">Boost by layering VIP bundles with retention sequences.</p>
          </div>
          <div className="rounded-lg border border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-medium text-slate-800">
              <span>Churn risk</span>
              <Badge className="bg-rose-100 text-rose-800">{Math.round(revenueHealth.churnRisk)}%</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">Target sleeping fans with automation to recover ${revenueHealth.winBackGoal.toLocaleString()} this month.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-slate-500" />
            <CardTitle>Fan priority queue</CardTitle>
          </div>
          <CardDescription>AI-ranked fans that deserve a personal touch right now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && totals.priorityQueue.length === 0 && <p className="text-xs text-slate-400">Loading fans…</p>}
          {totals.priorityQueue.length === 0 && !loading && <p className="text-xs text-slate-400">Connect OnlyFans and sync fans to activate the queue.</p>}
          {totals.priorityQueue.map((fan) => (
            <div key={fan.id} className="rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                <span>{fan.displayName}</span>
                <Badge className="bg-slate-100 text-slate-600">Score {fan.score}</Badge>
              </div>
              <p className="text-xs text-slate-500">Spent ${Math.round(fan.totalSpent).toLocaleString()} · Last purchase {fan.daysSincePurchase ?? '—'}d ago.</p>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-slate-500">
            Open message inbox
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-slate-500" />
            <CardTitle>Retention campaigns</CardTitle>
          </div>
          <CardDescription>Plan automations that keep fans subscribed and spending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {retentionIdeas.map((idea) => (
            <div key={idea.id} className="rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">{idea.title}</div>
                <Badge className="bg-slate-100 text-slate-600">{idea.cadence}</Badge>
              </div>
              <p className="text-xs text-slate-500">Segment: {idea.segment} · Projected lift +{idea.projectedLift}%</p>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-slate-500">
            Launch retention workflow
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-slate-500" />
            <CardTitle>Spending pattern analysis</CardTitle>
          </div>
          <CardDescription>Understand how fans progress through tiers and upsells.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <PatternStat label="New fan runway" value="3.2" suffix=" days" helper="Avg time from trial to paid." />
          <PatternStat label="Upsell velocity" value="47" suffix="%" helper="Fans who buy PPV within 48h." />
          <PatternStat label="VIP stickiness" value="89" suffix="%" helper="VIPs returning monthly." />
        </CardContent>
      </Card>
    </div>
  )
}

function SegmentMetric({ label, count, helper, icon: Icon, tone }: { label: string; count: number; helper: string; icon: ComponentType<{ className?: string }>; tone: 'emerald' | 'amber' | 'rose' }) {
  const toneClasses: Record<'emerald' | 'amber' | 'rose', string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    rose: 'bg-rose-50 border-rose-200 text-rose-900',
  } as const

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{count}</p>
      <p className="text-xs opacity-80">{helper}</p>
    </div>
  )
}

function PatternStat({ label, value, suffix, helper }: { label: string; value: string | number; suffix?: string; helper: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
        {suffix && <span className="text-base font-normal text-slate-500">{suffix}</span>}
      </p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  )
}
