import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Plug,
  Settings as SettingsIcon,
  AlertTriangle,
  ArrowUpRight,
  LucideIcon,
} from 'lucide-react';

import LiveCards from './LiveCards';
import MessagesPanel from './MessagesPanel';
import SoundSettings from './SoundSettings';
import TemplateLibrary from './TemplateLibrary';
import NicheSelector from './NicheSelector';

import type { OverviewMetrics } from '@/types/analytics';
import type { Conversation as CrmConversation, Fan as CrmFan } from '@/lib/services/crmData';
import { PPV_SOUND_EFFECTS } from '@/src/lib/of/ppv-sound-effects';
import { MODEL_NICHES, CONVERSION_SCRIPTS } from '@/src/lib/of/model-scripts-niches';

export const dynamic = 'force-dynamic';

type ApiResponse<T> = T | null;

type PlatformStatus = {
  onlyfans?: boolean;
  tiktok?: boolean;
  instagram?: boolean;
  reddit?: boolean;
  inflow?: boolean;
  supercreator?: boolean;
  error?: string;
};

type OnlyFansStatus = {
  connected?: boolean;
  reason?: string;
  platform?: { username?: string; lastSyncAt?: string } | null;
};

type TopHoursResponse = {
  hours?: number[];
};

type SidebarItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type SegmentSummary = {
  vip: number;
  bigSpenders: number;
  regulars: number;
  churned: number;
  total: number;
};

const NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'KPIs du jour', icon: LayoutDashboard },
  { id: 'messages', label: 'Messages', description: 'Inbox & AI', icon: MessageSquare },
  { id: 'fans', label: 'Fans', description: 'Segmentation CRM', icon: Users },
  { id: 'analytics', label: 'Analytics', description: 'Performance temps réel', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', description: 'Connexions OF & Proxy', icon: Plug },
  { id: 'settings', label: 'Settings', description: 'AI & sons PPV', icon: SettingsIcon },
];

export default async function AppVisuel() {
  const hdrs = headers();
  const protocol = hdrs.get('x-forwarded-proto') ?? 'https';
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const base = (process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : '')).replace(/\/$/, '');
  const cookieHeader = cookies().toString();

  const fetchApi = async <T,>(path: string, init?: RequestInit): Promise<ApiResponse<T>> => {
    if (!base) return null;
    try {
      const res = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          cookie: cookieHeader,
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        return null;
      }
      return (await res.json()) as T;
    } catch {
      return null;
    }
  };

  const [overview, topHours, onlyfansStatus, conversationsPayload, fansPayload, aiConfig, platforms] =
    await Promise.all([
      fetchApi<OverviewMetrics>('/api/analytics/overview'),
      fetchApi<TopHoursResponse>('/api/analytics/top-hours?platformType=onlyfans'),
      fetchApi<OnlyFansStatus>('/api/integrations/onlyfans/status'),
      fetchApi<{ conversations: CrmConversation[] }>('/api/crm/conversations'),
      fetchApi<{ fans: CrmFan[] }>('/api/crm/fans'),
      fetchApi<Record<string, unknown>>('/api/ai/config'),
      fetchApi<PlatformStatus>('/api/platforms/status'),
    ]);

  const conversations = conversationsPayload?.conversations ?? [];
  const fans = fansPayload?.fans ?? [];
  const segmentSummary = computeSegmentSummary(fans);
  const topValueFans = [...fans]
    .sort((a, b) => (b.valueCents ?? 0) - (a.valueCents ?? 0))
    .slice(0, 4);
  const atRiskFans = deriveAtRiskFans(fans);
  const peakHoursLabel = formatHourList(topHours?.hours ?? []);
  const bestFan = topValueFans[0];

  const soundConfig = (aiConfig?.ppvSounds as Record<string, unknown>) || {};
  const selectedNiche =
    (aiConfig?.persona as Record<string, unknown>)?.niche ??
    (aiConfig?.niche as string | undefined) ??
    '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-900/80 bg-black">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white">
              <img src="/logo.svg" alt="Huntaze" className="h-8 w-auto" />
              <span className="hidden text-sm font-semibold uppercase tracking-[0.18em] md:block">
                Huntaze AppVisuel
              </span>
            </Link>
          </div>
          <nav className="hidden items-center gap-3 text-sm font-medium text-gray-300 md:flex">
            <Link className="px-2 py-1 rounded-md hover:text-white focus-ring" href="/marketing">
              Marketing
            </Link>
            <Link className="px-2 py-1 rounded-md hover:text-white focus-ring" href="/app/app/dashboard">
              App
            </Link>
            <Link className="px-2 py-1 rounded-md hover:text-white focus-ring" href="/pricing">
              Pricing
            </Link>
            <Link className="px-2 py-1 rounded-md hover:text-white focus-ring" href="/auth">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative flex pt-16">
        <aside className="hidden w-64 shrink-0 surface elevation-0 lg:flex lg:flex-col p-4">
          <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Sections</p>
          </div>
          <nav className="flex-1 space-y-1 py-4">
            {NAV_ITEMS.map(({ id, label, description, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:text-gray-200 focus-ring"
              >
                <Icon className="h-4 w-4 text-gray-400 transition group-hover:text-gray-900 dark:group-hover:text-white" />
                <div className="flex flex-col">
                  <span>{label}</span>
                  <span className="text-xs font-normal text-gray-400">{description}</span>
                </div>
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-h-screen flex-1 lg:pl-64">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 lg:px-10">
            <Section id="dashboard" title="Dashboard" description="Vue d’ensemble temps réel">
              <div className="space-y-8">
                <LiveCards />

                <div className="grid gap-6 lg:grid-cols-4">
                  <KpiCard
                    title="Revenus mensuels"
                    value={formatCurrency(overview?.metrics?.revenueMonthly)}
                    delta={formatDelta(overview?.metrics?.change?.revenue)}
                    emphasize
                  />
                  <KpiCard
                    title="Abonnés actifs"
                    value={formatNumber(overview?.metrics?.activeSubscribers)}
                    delta={formatDelta(overview?.metrics?.change?.subscribers)}
                  />
                  <KpiCard
                    title="Temps de réponse AI"
                    value={formatDurationMinutes(overview?.metrics?.avgResponseSeconds)}
                    delta={formatDelta(-(overview?.metrics?.change?.response ?? 0))}
                  />
                  <KpiCard
                    title="Automatisation AI"
                    value={formatPercent(overview?.metrics?.aiAutomationRate)}
                    delta={formatDelta(overview?.metrics?.change?.automation)}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="surface elevation-1 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Today’s Money</p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                          {bestFan ? formatCurrency((bestFan.valueCents ?? 0) / 100) : '$0'}
                        </p>
                      </div>
                      <div className="chip bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                        Pic temps réel
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      Les opportunités du jour sont calculées via l’automatisation OnlyFans (Daily Action List). Connectez votre compte pour estimer les revenus immédiats.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {onlyfansStatus?.connected
                        ? 'Actions disponibles : vérifiez les relances urgentes ci-dessous.'
                        : 'Connectez OnlyFans pour débloquer les relances urgentes.'}
                    </div>
                  </div>

                  <div className="surface elevation-1 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top horaires d’engagement</h3>
                    <p className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">{peakHoursLabel}</p>
                    <p className="mt-3 text-sm text-gray-600">
                      Les créneaux ci-dessus proviennent de l’analyse comportementale des fans (fan segmentation + smart relance).
                    </p>
                    <Link href="/app/app/analytics" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300 focus-ring">
                      Voir l’analyse complète
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="surface elevation-1 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Alertes Smart Relance</h3>
                    {atRiskFans.length === 0 ? (
                      <p className="mt-6 text-sm text-gray-600">
                        Aucune relance prioritaire détectée pour le moment. Les fans VIP inactifs apparaîtront ici dès qu’un risque de churn est identifié.
                      </p>
                    ) : (
                      <ul className="mt-4 space-y-3 text-sm text-gray-700">
                        {atRiskFans.slice(0, 3).map((fan) => (
                          <li key={fan.id} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                            <p className="font-semibold">{fan.name}</p>
                            <p>
                              Inactif depuis {fan.daysInactive} jours · potentiel{' '}
                              <span className="font-medium">{formatCurrency((fan.valueCents ?? 0) / 100)}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href="/app/app/messages" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300 focus-ring">
                      Ouvrir les relances
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="surface elevation-1 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top fans (sur 30 jours)</h3>
                  {overview?.topFans?.length ? (
                    <ul className="mt-5 grid gap-4 md:grid-cols-2">
                      {overview.topFans.slice(0, 4).map((fan) => (
                        <li key={fan.username} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{fan.name}</p>
                              <p className="text-xs text-gray-500">@{fan.username}</p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                              {fan.badge.toUpperCase()}
                            </span>
                          </div>
                          <dl className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center justify-between">
                              <dt>Revenu</dt>
                              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(fan.revenue)}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt>Messages</dt>
                              <dd className="font-medium text-gray-900 dark:text-white">{fan.messages}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt>Dernière activité</dt>
                              <dd>{formatRelativeDay(fan.lastActive)}</dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-gray-600">
                      Connectez OnlyFans pour voir quels fans génèrent le plus de revenus et déclenchez des relances ciblées automatiquement.
                    </p>
                  )}
                </div>
              </div>
            </Section>

            <Section id="messages" title="Messages" description="Inbox unifiée et réponses AI personnalisées">
              <MessagesPanel
                initialConversations={conversations}
                fans={fans}
                aiResponseStyle={String(aiConfig?.responseStyle ?? '')}
              />
            </Section>

            <Section id="fans" title="Fans" description="Segmentation CRM & relances intelligentes">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatPill label="VIP Whales" value={segmentSummary.vip} badge="≥ $500" highlight />
                  <StatPill label="Big Spenders" value={segmentSummary.bigSpenders} badge="$100 – $499" />
                  <StatPill label="Regulars" value={segmentSummary.regulars} badge="$20 – $99" />
                  <StatPill label="Churn détecté" value={segmentSummary.churned} badge="30+ jours inactifs" tone="danger" />
                </div>

                <div className="surface elevation-1 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-3">Fan</th>
                        <th className="px-4 py-3">Valeur vie</th>
                        <th className="px-4 py-3">Dernière activité</th>
                        <th className="px-4 py-3">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                      {topValueFans.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-600">
                            Aucun fan enregistré pour le moment. Importez vos données OnlyFans pour enrichir la segmentation.
                          </td>
                        </tr>
                      ) : (
                        topValueFans.map((fan) => (
                          <tr key={fan.id}>
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{fan.name}</div>
                              {fan.handle ? <div className="text-xs text-gray-500">{fan.handle}</div> : null}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                              {formatCurrency((fan.valueCents ?? 0) / 100)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                              {formatRelativeDay(fan.updatedAt)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                {(fan.tags ?? []).slice(0, 3).map((tag) => (
                                <span key={tag} className="chip bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                                  {tag}
                                </span>
                                ))}
                                {!fan.tags?.length ? <span className="text-xs text-gray-400">—</span> : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="surface-muted elevation-0 p-6 text-sm text-gray-700 dark:text-gray-200">
                  <p className="font-semibold">Relances intelligentes</p>
                  <p className="mt-2">
                    Le module <span className="font-semibold">Smart Relance</span> surveille chaque fan et propose les actions prioritaires (VIP silencieux,
                    PPV abandonnés, win-back…). Activez-le en connectant votre OnlyFans : les relances peuvent partir automatiquement avec l’AI Huntaze.
                  </p>
                </div>
              </div>
            </Section>

            <Section id="analytics" title="Analytics" description="Indicateurs revenus & engagement">
              <div className="grid gap-6 lg:grid-cols-3">
                <AnalyticsCard
                  title="Revenu 30 derniers jours"
                  primary={formatCurrency(sumArray(overview?.revenueSeries?.values ?? []))}
                  detail={overview?.revenueSeries?.labels?.slice(-4) ?? []}
                  values={overview?.revenueSeries?.values?.slice(-4) ?? []}
                />
                <AnalyticsCard
                  title="Croissance fans"
                  primary={formatNumber(sumArray(overview?.fanGrowth?.newFans ?? []))}
                  detail={overview?.fanGrowth?.labels?.slice(-4) ?? []}
                  values={overview?.fanGrowth?.activeFans?.slice(-4) ?? []}
                />
                <AnalyticsCard
                  title="Répartition plateformes"
                  primary={
                    overview?.platformDistribution?.length
                      ? `${Math.round((overview.platformDistribution[0].share ?? 0) * 100)}%`
                      : '--'
                  }
                  detail={(overview?.platformDistribution ?? []).map((item) => item.platform.toUpperCase())}
                  values={(overview?.platformDistribution ?? []).map((item) => Math.round((item.share ?? 0) * 100))}
                />
              </div>
              <div className="surface elevation-1 mt-6 p-6 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Toutes les métriques sont récupérées en direct depuis OnlyFans (via le navigateur automatisé) et consolidées par Huntaze pour mesurer la
                  conversion PPV, la rétention et l’impact des campagnes AI.
                </p>
              </div>
            </Section>

            <Section id="integrations" title="Integrations" description="Connexion OnlyFans & Proxy sécurisé">
              <div className="space-y-6">
                <div className="surface elevation-1 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">OnlyFans</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Statut :{' '}
                        <span className={onlyfansStatus?.connected ? 'text-green-600' : 'text-red-600'}>
                          {onlyfansStatus?.connected ? 'Connecté' : 'Non connecté'}
                        </span>
                      </p>
                      {onlyfansStatus?.platform?.username ? (
                        <p className="text-xs text-gray-500">Compte : {onlyfansStatus.platform.username}</p>
                      ) : null}
                    </div>
                    <Link
                      href="/app/app/platforms/connect"
                      className="btn btn-primary"
                    >
                      Gérer la connexion
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Authentification via navigateur Playwright + cookies chiffrés (AES-256). Les sessions sont rafraîchies automatiquement par le session
                    manager Huntaze.
                  </p>
                </div>

                <div className="surface elevation-1 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Autres plateformes</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: 'TikTok', active: platforms?.tiktok },
                      { label: 'Instagram', active: platforms?.instagram },
                      { label: 'Reddit', active: platforms?.reddit },
                      { label: 'Inflow CRM', active: platforms?.inflow },
                      { label: 'Supercreator', active: platforms?.supercreator },
                    ].map((item) => (
                      <StatusPill key={item.label} label={item.label} active={Boolean(item.active)} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Le proxy manager Bright Data gère la rotation IP et les sessions collantes pour toutes les actions automatisées (login, DM, export stats).
                  </p>
                </div>
              </div>
            </Section>

            <Section id="settings" title="Settings" description="Personnalisation AI, sons PPV et scripts">
              <div className="grid gap-6 xl:grid-cols-2">
                <SoundSettings
                  sounds={PPV_SOUND_EFFECTS}
                  aiConfig={aiConfig}
                  initialEnabled={Boolean(soundConfig.enabled ?? true)}
                  initialSoundId={String(soundConfig.soundId ?? 'cash-register')}
                  initialVolume={typeof soundConfig.volume === 'number' ? Number(soundConfig.volume) : 0.7}
                />
                <NicheSelector
                  niches={MODEL_NICHES}
                  aiConfig={aiConfig}
                  initialSelection={String(selectedNiche || '')}
                />
                <TemplateLibrary scripts={CONVERSION_SCRIPTS} />
              </div>
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{title}</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{description}</h2>
      </header>
      {children}
    </section>
  );
}

function KpiCard({ title, value, delta, emphasize }: { title: string; value: string; delta?: string; emphasize?: boolean }) {
  return (
    <div
      className={`surface elevation-1 p-6 transition ${
        emphasize ? 'ring-1 ring-purple-200/40 dark:ring-purple-500/30' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {delta ? <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">{delta}</p> : null}
    </div>
  );
}

function StatPill({
  label,
  value,
  badge,
  tone = 'neutral',
  highlight = false,
}: {
  label: string;
  value: number;
  badge?: string;
  tone?: 'neutral' | 'danger';
  highlight?: boolean;
}) {
  const toneClasses =
    tone === 'danger'
      ? 'bg-red-50 text-red-700 border-red-200'
      : highlight
        ? 'bg-white text-gray-900 border-gray-900/10 shadow-sm dark:bg-gray-900 dark:text-white dark:border-gray-700'
        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
  return (
    <div className={`rounded-2xl border px-4 py-4 text-sm font-medium ${toneClasses}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {badge ? <p className="mt-1 text-xs text-gray-500">{badge}</p> : null}
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium ${
      active ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
             : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }`}>
      <span>{label}</span>
      <span>{active ? 'Connecté' : 'À connecter'}</span>
    </div>
  );
}

function AnalyticsCard({
  title,
  primary,
  detail,
  values,
}: {
  title: string;
  primary: string;
  detail: string[];
  values: number[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{primary}</p>
      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        {detail.map((label, idx) => (
          <div key={label} className="flex items-center justify-between">
            <span>{label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{values[idx] ?? '--'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeSegmentSummary(fans: CrmFan[]): SegmentSummary {
  if (!fans.length) {
    return { vip: 0, bigSpenders: 0, regulars: 0, churned: 0, total: 0 };
  }
  const now = Date.now();
  return fans.reduce<SegmentSummary>(
    (acc, fan) => {
      const value = fan.valueCents ?? 0;
      if (value >= 50_000) acc.vip += 1;
      else if (value >= 10_000) acc.bigSpenders += 1;
      else if (value >= 2_000) acc.regulars += 1;

      const last = fan.lastSeenAt ?? fan.updatedAt ?? fan.createdAt;
      if (last) {
        const days = Math.floor((now - new Date(last).getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 30) acc.churned += 1;
      }

      acc.total += 1;
      return acc;
    },
    { vip: 0, bigSpenders: 0, regulars: 0, churned: 0, total: 0 },
  );
}

function deriveAtRiskFans(fans: CrmFan[]) {
  const now = Date.now();
  return fans
    .map((fan) => {
      const last = fan.lastSeenAt ?? fan.updatedAt ?? fan.createdAt;
      const daysInactive = last ? Math.floor((now - new Date(last).getTime()) / (1000 * 60 * 60 * 24)) : null;
      return {
        ...fan,
        daysInactive,
      };
    })
    .filter((fan) => {
      const value = fan.valueCents ?? 0;
      return value >= 20_000 && (fan.daysInactive ?? 0) >= 7;
    })
    .sort((a, b) => (b.valueCents ?? 0) - (a.valueCents ?? 0));
}

function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '--';
  return `${Math.round(value * 100)}%`;
}

function formatDelta(value?: number | null): string | undefined {
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  const formatter = new Intl.NumberFormat('en-US', { signDisplay: 'always', maximumFractionDigits: 1 });
  return `${formatter.format(value)}% vs. mois précédent`;
}

function formatDurationMinutes(seconds?: number | null): string {
  if (!seconds || Number.isNaN(seconds)) return '--';
  const mins = seconds / 60;
  if (mins < 1) {
    return `${Math.round(seconds)}s`;
  }
  return `${mins.toFixed(1)}min`;
}

function formatRelativeDay(dateLike?: string | Date | null): string {
  if (!dateLike) return '—';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return `Il y a ${diff} jours`;
}

function formatHourList(hours: number[]): string {
  if (!hours.length) return 'En attente de données';
  return hours.map((hour) => formatHour(hour)).join(', ');
}

function formatHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const value = normalized % 12 || 12;
  return `${value}${suffix}`;
}

function sumArray(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + (value || 0), 0);
}
