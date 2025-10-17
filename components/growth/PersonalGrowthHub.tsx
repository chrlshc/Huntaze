'use client'

import { useMemo } from 'react'
import {
  Target,
  BarChart3,
  Compass,
  Brain,
  Rocket,
  Instagram,
  PlayCircle,
  Megaphone,
  Users,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

import type { DashboardStats, Opportunity, RevenuePoint } from '@/hooks/useData'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface PersonalGrowthHubProps {
  stats?: DashboardStats | null
  opportunities?: Opportunity[]
  revenueTrend?: RevenuePoint[]
  connectedPlatforms?: Partial<Record<'onlyfans' | 'instagram' | 'tiktok' | 'reddit', boolean>>
}

type GrowthPlay = {
  id: string
  label: string
  impact: 'high' | 'medium' | 'low'
  description: string
  progress: number
  nextStep: string
}

const defaultRoadmap: GrowthPlay[] = [
  {
    id: 'brand-refresh',
    label: 'Reboot your top-of-funnel identity',
    impact: 'high',
    description: 'Ship new highlight covers and a hero pinned post across OF, IG, and Reddit.',
    progress: 64,
    nextStep: 'Import new visuals into Content Library',
  },
  {
    id: 'conversion-ladder',
    label: 'Build the 7-day conversion ladder',
    impact: 'high',
    description: 'Sequence DM flows that move promo leads to trials, trials to VIP tiers.',
    progress: 41,
    nextStep: 'Assign upsell templates to the win-back automation.',
  },
  {
    id: 'retention-drip',
    label: 'Retention momentum campaigns',
    impact: 'medium',
    description: 'Launch weekly surprises and milestone rewards to deepen loyalty.',
    progress: 22,
    nextStep: 'Draft milestone reward message in AI Studio.',
  },
]

const platformOrder: Array<{ id: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit'; label: string; icon: typeof Instagram }> = [
  { id: 'onlyfans', label: 'OnlyFans', icon: Rocket },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'tiktok', label: 'TikTok', icon: PlayCircle },
  { id: 'reddit', label: 'Reddit', icon: Megaphone },
]

function impactBadge(impact: GrowthPlay['impact']) {
  if (impact === 'high') {
    return <Badge className="bg-emerald-100 text-emerald-800">High impact</Badge>
  }
  if (impact === 'medium') {
    return <Badge className="bg-amber-100 text-amber-800">Medium impact</Badge>
  }
  return <Badge className="bg-slate-100 text-slate-700">Low impact</Badge>
}

export function PersonalGrowthHub({ stats, opportunities, revenueTrend, connectedPlatforms }: PersonalGrowthHubProps) {
  const baselineGrowth = useMemo(() => {
    if (!stats || !revenueTrend || revenueTrend.length === 0) return 0
    const last = revenueTrend[revenueTrend.length - 1]?.value ?? 0
    const first = revenueTrend[0]?.value ?? 0
    if (first === 0) return 0
    return Math.round(((last - first) / Math.max(first, 1)) * 100)
  }, [stats, revenueTrend])

  const activePlatforms = useMemo(() => {
    return platformOrder.map((platform) => ({
      ...platform,
      active: connectedPlatforms ? Boolean(connectedPlatforms[platform.id]) : platform.id === 'onlyfans',
    }))
  }, [connectedPlatforms])

  const curatedOpportunities = useMemo(() => {
    if (opportunities && opportunities.length > 0) {
      return opportunities.slice(0, 3)
    }
    return [
      {
        title: 'Launch VIP retention flow',
        description: 'Your top 5 spenders have been silent 14+ days. Offer a premium pack to re-engage.',
        actionText: 'Start retention flow',
        actionLink: '/app/growth/automations',
      },
      {
        title: 'Spin up a Reddit spotlight',
        description: 'Reddit threads drove 31% of trials last month—schedule a live AMA to keep momentum.',
        actionText: 'Schedule Reddit push',
        actionLink: '/app/growth/social',
      },
      {
        title: 'Test bundle pricing',
        description: 'Bundle testing has a projected +18% ARPU lift with your current audience blend.',
        actionText: 'Open pricing lab',
        actionLink: '/app/revenue/optimizer',
      },
    ]
  }, [opportunities])

  const northStar = useMemo(() => {
    const targetRevenue = stats ? Math.round(stats.revenueBreakdown.month * 1.25) : 12000
    const fanTarget = stats ? Math.round(stats.fans * 1.2) : 180
    return {
      revenue: targetRevenue,
      fans: fanTarget,
      lift: baselineGrowth || 26,
    }
  }, [stats, baselineGrowth])

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Personal Growth Hub</CardTitle>
            <CardDescription>Turn agency-style brand, campaign, and expansion playbooks into daily wins.</CardDescription>
          </div>
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate next 30-day plan
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-6 shadow-inner">
            <div className="flex items-center gap-3">
              <Target className="h-10 w-10 text-emerald-300" />
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-400">North-star target</p>
                <p className="text-3xl font-semibold">${northStar.revenue.toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">Reach {northStar.fans} paying fans with a projected lift of +{northStar.lift}% using the recommended roadmap.</p>
            <div className="mt-6 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Campaign runway</span>
                <Badge className="bg-slate-700 text-white">18 days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Brand consistency</span>
                <Badge className="bg-emerald-200/70 text-emerald-900">92%</Badge>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid gap-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Strategic roadmap
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                  Export to Notion
                </Button>
              </div>
              <div className="mt-3 space-y-4">
                {defaultRoadmap.map((play) => (
                  <div key={play.id} className="rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-slate-800">{play.label}</p>
                          {impactBadge(play.impact)}
                        </div>
                        <p className="text-xs text-slate-500">{play.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                        {play.nextStep}
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    <Progress value={play.progress} className="mt-3" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-slate-500" />
                    <CardTitle className="text-base">Brand builder</CardTitle>
                  </div>
                  <CardDescription>Align visuals, tone, and hooks across every funnel touchpoint.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RoadmapItem title="Voice board" detail="14 hooks validated by AI sentiment scoring." />
                  <RoadmapItem title="Visual DNA" detail="4 platform cover sets ready to deploy." />
                  <RoadmapItem title="Positioning" detail="USP updated for 2025 creator trends." />
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-slate-500" />
                    <CardTitle className="text-base">Content strategy advisor</CardTitle>
                  </div>
                  <CardDescription>Decide what to shoot next using data-backed prompts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RoadmapItem title="High-converting pillars" detail="Story, intimacy, exclusives." />
                  <RoadmapItem title="Upcoming drops" detail="3 drops pending moodboard approval." />
                  <RoadmapItem title="Promo assets" detail="6 TikTok hooks ready to film." />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" />
              <CardTitle>Cross-platform growth tracker</CardTitle>
            </div>
            <CardDescription>Monitor acquisition velocity across each audience channel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {activePlatforms.map((platform) => (
              <div key={platform.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <platform.icon className="h-4 w-4" />
                    {platform.label}
                  </div>
                  <Badge className={platform.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                    {platform.active ? 'Synced' : 'Connect'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {platform.active
                    ? 'Live traffic and conversion tracking enabled.'
                    : 'Connect to unlock channel-specific guidance.'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-slate-500" />
              <CardTitle>Action queue</CardTitle>
            </div>
            <CardDescription>High-ROI moves to execute this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {curatedOpportunities.map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
                <Button variant="ghost" size="sm" className="mt-2 text-xs text-slate-500" asChild>
                  <a href={item.actionLink}>{item.actionText}</a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RoadmapItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  )
}

