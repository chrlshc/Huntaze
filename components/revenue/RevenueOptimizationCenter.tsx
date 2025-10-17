'use client'

import { useMemo } from 'react'
import {
  DollarSign,
  LineChart,
  Wallet,
  TrendingUp,
  Gauge,
  BarChart4,
  TestTubes,
  ArrowUpRight,
  Coins,
  Crown,
} from 'lucide-react'

import type { DashboardStats, RevenuePoint } from '@/hooks/useData'
import type { EfficiencyFan } from '@/components/creator/CreatorEfficiencySuite'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface RevenueOptimizationCenterProps {
  stats?: DashboardStats | null
  revenueTrend?: RevenuePoint[]
  fans?: EfficiencyFan[]
}

type PricingExperiment = {
  id: string
  label: string
  goal: string
  lift: number
  status: 'running' | 'planned' | 'completed'
  eta: string
}

type TierBreakdown = {
  id: string
  title: string
  price: number
  adoption: number
  recommendation: string
}

const experiments: PricingExperiment[] = [
  {
    id: 'upsell-bundle',
    label: 'Bundle: VIP + weekly customs',
    goal: 'Increase VIP ARPU',
    lift: 21,
    status: 'running',
    eta: '3 days remaining',
  },
  {
    id: 'trial-boost',
    label: 'Free trial → $12 core tier',
    goal: 'Trial conversions',
    lift: 14,
    status: 'planned',
    eta: 'Launch Friday',
  },
  {
    id: 'ppv-sweet-spot',
    label: 'PPV two-step upsell',
    goal: 'Raise PPV acceptance',
    lift: 17,
    status: 'running',
    eta: 'Collecting data',
  },
]

const tierBlueprint: TierBreakdown[] = [
  {
    id: 'supporter',
    title: 'Supporter',
    price: 12,
    adoption: 58,
    recommendation: 'Hold price — sweet spot for new fans.',
  },
  {
    id: 'vip',
    title: 'VIP',
    price: 38,
    adoption: 29,
    recommendation: 'Add loyalty perk to push adoption past 35%.',
  },
  {
    id: 'elite',
    title: 'Elite',
    price: 95,
    adoption: 13,
    recommendation: 'Introduce scarcity drop to increase conversion velocity.',
  },
]

export function RevenueOptimizationCenter({ stats, revenueTrend, fans }: RevenueOptimizationCenterProps) {
  const trailingRevenue = stats?.revenueBreakdown.month ?? 0
  const fanCount = stats?.fans ?? fans?.length ?? 0

  const forecastLift = useMemo(() => {
    if (!revenueTrend || revenueTrend.length < 2) return 18
    const lastTwo = revenueTrend.slice(-2)
    const prev = lastTwo[0]?.value ?? 0
    const last = lastTwo[1]?.value ?? prev
    if (prev === 0) return 18
    return Math.max(10, Math.round(((last - prev) / Math.max(prev, 1)) * 100))
  }, [revenueTrend])

  const medianSpend = useMemo(() => {
    if (!fans || fans.length === 0) return 42
    const totals = fans.map((fan) => fan.totalSpent).sort((a, b) => a - b)
    const mid = Math.floor(totals.length / 2)
    return totals.length % 2 ? totals[mid] : (totals[mid - 1] + totals[mid]) / 2
  }, [fans])

  const ppvRecommendation = useMemo(() => {
    const baseline = stats ? Math.max(stats.avgRevenuePerFan, 12) : 16
    return {
      suggested: Math.round(baseline * 1.35),
      rationale: 'Based on high-intent fans responding to premium bundles and late-night push windows.',
    }
  }, [stats])

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Revenue Optimization</CardTitle>
            <CardDescription>Forecast earnings, optimize pricing, and unlock smarter monetization moves.</CardDescription>
          </div>
          <Button className="gap-2">
            <LineChart className="h-4 w-4" />
            Generate forecast deck
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-6 shadow-inner">
            <div className="flex items-center gap-3">
              <Wallet className="h-10 w-10 text-emerald-300" />
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-400">Trailing 30 days</p>
                <p className="text-3xl font-semibold">${Math.round(trailingRevenue).toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">Projected {forecastLift}% lift with current experiments and upsell flows.</p>
            <div className="mt-6 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Fans analyzed</span>
                <Badge className="bg-slate-700 text-white">{fanCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Median spend</span>
                <Badge className="bg-emerald-200/60 text-emerald-900">${Math.round(medianSpend)}</Badge>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid gap-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Active experiments
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                  Manage experiments
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {experiments.map((experiment) => (
                  <div key={experiment.id} className="rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-slate-800">{experiment.label}</p>
                          <Badge className={experiment.status === 'running' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                            {experiment.status === 'running' ? 'Running' : experiment.status === 'planned' ? 'Planned' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{experiment.goal}</p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <p className="font-medium">+{experiment.lift}% lift</p>
                        <p className="text-xs">{experiment.eta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Tier optimizer
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                    Adjust tiers
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {tierBlueprint.map((tier) => (
                    <div key={tier.id} className="rounded-lg border border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                        <span>{tier.title}</span>
                        <span>${tier.price}</span>
                      </div>
                      <Progress value={tier.adoption} className="mt-2" />
                      <p className="text-xs text-slate-500">Adoption {tier.adoption}% · {tier.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <TestTubes className="h-4 w-4" />
                    PPV price testing
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                    Add variant
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                      <span>Baseline</span>
                      <span>${Math.round((stats?.avgRevenuePerFan ?? 18) * 1.1)}</span>
                    </div>
                    <p className="text-xs text-slate-500">Current conversion 42% · Sample size 210</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
                      <span>Suggested</span>
                      <span>${ppvRecommendation.suggested}</span>
                    </div>
                    <p className="text-xs text-emerald-700">{ppvRecommendation.rationale}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                      <span>VIP bump</span>
                      <span>${Math.round(ppvRecommendation.suggested * 1.4)}</span>
                    </div>
                    <p className="text-xs text-slate-500">Bundle with loyalty reward to protect churn.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-slate-500" />
              <CardTitle>Revenue projection</CardTitle>
            </div>
            <CardDescription>Plan best and worst-case outcomes before launching campaigns.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {['Conservative', 'Likely', 'Stretch'].map((label, index) => {
              const rangeBase = trailingRevenue || 8700
              const multiplier = [1.05, 1.28, 1.62][index]
              const value = Math.round(rangeBase * multiplier)
              return (
                <div key={label} className="rounded-lg border border-slate-200 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">${value.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Assumes churn control and {index === 2 ? 'VIP bundle success.' : 'steady conversion.'}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-slate-500" />
              <CardTitle>Action checklist</CardTitle>
            </div>
            <CardDescription>Monetization moves queued for this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChecklistItem label="Lock in weekend VIP flash" helper="Schedule 4-hour exclusive drop for top spenders." />
            <ChecklistItem label="Segment high churn risk" helper="Auto-enroll inactive fans into retention automation." />
            <ChecklistItem label="Sync pricing with social" helper="Update Link-in-bio cards to reflect bundle pricing." />
            <Button variant="ghost" size="sm" className="w-full text-slate-500">
              View revenue playbook
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ChecklistItem({ label, helper }: { label: string; helper: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Crown className="h-4 w-4 text-slate-500" />
        {label}
      </div>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  )
}

