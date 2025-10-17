'use client'

import { useMemo, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  EyeOff,
  Lock,
  RefreshCw,
  HardDriveDownload,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Globe,
  Moon,
} from 'lucide-react'

import type { DashboardStats } from '@/hooks/useData'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export type SecurityAlert = {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  resolved: boolean
}

export interface CreatorProtectionCenterProps {
  stats?: DashboardStats | null
  connectedPlatforms?: Partial<Record<'onlyfans' | 'instagram' | 'tiktok' | 'reddit', boolean>>
  recentAlerts?: SecurityAlert[]
}

type RiskBreakdown = {
  label: string
  value: number
  helper: string
  icon: typeof ShieldCheck | typeof ShieldAlert | typeof Activity | typeof AlertTriangle
}

type PrivacyControl = {
  id: string
  label: string
  helper: string
}

type BackupStatus = {
  id: string
  label: string
  lastRun: string
  coverage: number
}

const watermarkPresets = [
  { id: 'subtle', label: 'Subtle brand plate', intensity: 32 },
  { id: 'bold', label: 'Bold diagonal', intensity: 68 },
  { id: 'signature', label: 'Signature lockup', intensity: 54 },
]

const defaultPrivacyControls: PrivacyControl[] = [
  { id: 'metadata', label: 'Strip EXIF metadata', helper: 'Removes GPS and device details from uploads.' },
  { id: 'dm-screen', label: 'Auto-blur sensitive previews', helper: 'Protects previews in leaked screenshots.' },
  { id: 'watermark-ai', label: 'Invisible AI watermark', helper: 'Embeds signals detectable by takedown tools.' },
]

const defaultBackups: BackupStatus[] = [
  { id: 'cloud', label: 'Encrypted cloud vault', lastRun: '42 minutes ago', coverage: 100 },
  { id: 'onlyfans', label: 'OnlyFans export', lastRun: '5 hours ago', coverage: 87 },
  { id: 'social', label: 'Cross-platform sync', lastRun: 'Yesterday 20:14', coverage: 61 },
]

const defaultAlerts: SecurityAlert[] = [
  {
    id: 'alert-ig-session',
    title: 'Instagram login recycled',
    description: 'Session originated from a new device in Madrid. 2FA challenge blocked access.',
    severity: 'medium',
    timestamp: '2025-02-21T09:32:00Z',
    resolved: false,
  },
  {
    id: 'alert-dm-spam',
    title: 'Bulk DM scrape attempt',
    description: 'Detected 58 sequential DM pulls in 30 seconds. IP automatically throttled.',
    severity: 'high',
    timestamp: '2025-02-20T22:11:00Z',
    resolved: false,
  },
  {
    id: 'alert-of-password',
    title: 'Password rotation overdue',
    description: 'OnlyFans password untouched for 92 days. Recommend rotating credentials.',
    severity: 'low',
    timestamp: '2025-02-17T12:05:00Z',
    resolved: true,
  },
]

function severityBadge(severity: SecurityAlert['severity']) {
  if (severity === 'high') return <Badge variant="destructive" className="bg-rose-100 text-rose-800">High</Badge>
  if (severity === 'medium') return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>
  return <Badge className="bg-emerald-100 text-emerald-800">Low</Badge>
}

export function CreatorProtectionCenter({ stats, connectedPlatforms, recentAlerts }: CreatorProtectionCenterProps) {
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<string>('signature')
  const [autoRotate, setAutoRotate] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const alerts = recentAlerts && recentAlerts.length ? recentAlerts : defaultAlerts

  const activePlatforms = useMemo(() => {
    return connectedPlatforms ? Object.entries(connectedPlatforms).filter(([, value]) => value).map(([key]) => key) : ['onlyfans']
  }, [connectedPlatforms])

  const unresolvedAlerts = useMemo(() => alerts.filter((alert) => !alert.resolved), [alerts])

  const riskScore = useMemo(() => {
    const engagementPenalty = stats ? Math.max(0, 50 - stats.engagementRate) : 18
    const alertPenalty = unresolvedAlerts.length * 6
    const platformBonus = activePlatforms.length * 4
    return Math.max(0, Math.min(100, 82 - engagementPenalty - alertPenalty + platformBonus))
  }, [stats, unresolvedAlerts.length, activePlatforms.length])

  const riskBreakdown: RiskBreakdown[] = useMemo(() => [
    {
      label: 'Content watermark coverage',
      value: watermarkEnabled ? 94 : 35,
      helper: watermarkEnabled ? 'All new assets stamped on upload.' : 'Watermarking disabled for new posts.',
      icon: ShieldCheck,
    },
    {
      label: 'Privacy resilience',
      value: 68 + activePlatforms.length * 4,
      helper: `${activePlatforms.length} platforms protected with metadata scrubbing.`,
      icon: EyeOff,
    },
    {
      label: 'Threat mitigation',
      value: Math.max(20, 100 - unresolvedAlerts.length * 18),
      helper: unresolvedAlerts.length ? `${unresolvedAlerts.length} open alerts need review.` : 'No open incidents detected.',
      icon: AlertTriangle,
    },
    {
      label: 'Account recovery readiness',
      value: autoRotate ? 92 : 54,
      helper: autoRotate ? 'Login secrets rotate every 30 days.' : 'Enable rotation to raise the score.',
      icon: Activity,
    },
  ], [watermarkEnabled, autoRotate, unresolvedAlerts.length, activePlatforms.length])

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Creator Protection Overview</CardTitle>
            <CardDescription>
              Real-time monitoring keeps your content, identity, and audiences safe while you stay focused on creation.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={darkMode}
              onChange={(e) => setDarkMode((e.target as HTMLInputElement).checked)}
              aria-label="Toggle night shield"
            />
            <span className="text-sm text-slate-600">Night shield</span>
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              Run deep scan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-6 shadow-inner">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-emerald-300" />
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-400">Protection score</p>
                <p className="text-3xl font-semibold">{riskScore}%</p>
              </div>
            </div>
            <Progress value={riskScore} className="mt-4 bg-slate-700" />
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Active shields</span>
                <Badge className="bg-emerald-200/70 text-emerald-900">{activePlatforms.length}</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Open incidents</span>
                <Badge variant="destructive" className="bg-rose-100 text-rose-800">{unresolvedAlerts.length}</Badge>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2 grid gap-4">
            {riskBreakdown.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 p-4 flex items-center gap-4">
                <item.icon className="h-9 w-9 text-slate-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <Progress value={item.value} className="mt-2" />
                  <p className="mt-2 text-xs text-slate-500">{item.helper}</p>
                </div>
                <div className="text-lg font-semibold text-slate-900">{item.value}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-slate-500" />
              <CardTitle>Content watermarking</CardTitle>
            </div>
            <CardDescription>Keep leaked content traceable and disrupt reposting networks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div>
                <p className="font-medium text-slate-900">Auto watermark new uploads</p>
                <p className="text-xs text-slate-500">Applies brand-safe watermark during ingestion pipeline.</p>
              </div>
              <Switch
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled((e.target as HTMLInputElement).checked)}
                aria-label="Toggle watermark"
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">Preset</label>
              <Select
                value={selectedPreset}
                onChange={(event: any) => setSelectedPreset((event.target as HTMLSelectElement).value)}
                aria-label="Select watermark preset"
              >
                {watermarkPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>{preset.label}</SelectItem>
                ))}
              </Select>
              <p className="text-xs text-slate-500">Intensity automatically scales per platform to keep content aesthetic.</p>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <p>Drop a new asset to preview watermark output.</p>
              <Button variant="outline" size="sm" className="mt-3">Upload preview</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-slate-500" />
              <CardTitle>Privacy protection tools</CardTitle>
            </div>
            <CardDescription>Neutralize content scrapers and block harassment patterns automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {defaultPrivacyControls.map((control) => (
              <div key={control.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{control.label}</p>
                  <p className="text-xs text-slate-500">{control.helper}</p>
                </div>
                <Switch defaultChecked aria-label={control.label} />
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">Harassment filter keywords</p>
              <Input placeholder="Add keyword" className="mt-3" />
              <p className="mt-2 text-xs text-slate-500">Keywords sync to Instagram, Reddit, and OnlyFans DM filters.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              <CardTitle>Safety monitor</CardTitle>
            </div>
            <CardDescription>Live threat detection across all linked platforms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-100 text-slate-700">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
                    {severityBadge(alert.severity)}
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">{alert.title}</p>
                  <p className="text-sm text-slate-500">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.resolved ? (
                    <Badge className="bg-emerald-100 text-emerald-800">Resolved</Badge>
                  ) : (
                    <Button variant="outline" size="sm">Resolve</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-slate-500">View details</Button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-3 font-medium text-slate-800">No incidents detected</p>
                <p className="text-xs text-slate-500">We monitor new sessions, DM scraping, and content leaks 24/7.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-500" />
              <CardTitle>Account security</CardTitle>
            </div>
            <CardDescription>Daily checks ensure every login surface is hardened.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SecurityChecklist autoRotate={autoRotate} connected={connectedPlatforms} />
            <BackupCoverage backups={defaultBackups} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SecurityChecklist({ autoRotate, connected }: { autoRotate: boolean; connected?: CreatorProtectionCenterProps['connectedPlatforms'] }) {
  const checklist = useMemo(() => [
    {
      id: 'onlyfans-2fa',
      label: 'OnlyFans 2FA enforced',
      solved: true,
      icon: ShieldCheck,
    },
    {
      id: 'platform-coverage',
      label: `${Object.entries(connected || {}).filter(([, status]) => status).length || 1} platforms monitored`,
      solved: Boolean(connected && Object.values(connected).some(Boolean)),
      icon: Globe,
    },
    {
      id: 'password-rotation',
      label: autoRotate ? 'Password rotation scheduled' : 'Rotate passwords every 30 days',
      solved: autoRotate,
      icon: RefreshCw,
    },
    {
      id: 'night-mode',
      label: 'Night shield active',
      solved: true,
      icon: Moon,
    },
  ], [autoRotate, connected])

  return (
    <div className="space-y-3">
      {checklist.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          {item.solved ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
          <div>
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            {!item.solved && <p className="text-xs text-slate-500">Enable this control to raise your protection score.</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

function BackupCoverage({ backups }: { backups: BackupStatus[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <HardDriveDownload className="h-4 w-4" />
        Content backup & recovery
      </div>
      {backups.map((backup) => (
        <div key={backup.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{backup.label}</span>
            <span className="text-xs text-slate-500">Last run {backup.lastRun}</span>
          </div>
          <Progress value={backup.coverage} />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full mt-2">Run instant backup</Button>
    </div>
  )
}
