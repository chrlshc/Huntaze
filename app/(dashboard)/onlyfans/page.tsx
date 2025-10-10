'use client';

import { useMemo } from 'react';

import ConnectorGraph, { type LinkDef, type NodeDef } from '@/components/hz/ConnectorGraph';
import SectionExplainer from '@/components/hz/SectionExplainer';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { useOnlyFansDashboard } from '@/hooks/useOnlyFansDashboard';
import { createModuleStatus } from '@/types/branded';

export default function OnlyFansHomePage() {
  const { data, loading, error, refresh } = useOnlyFansDashboard();

  const summaryCards = data?.summaryCards ?? [];
  const actionItems = data?.actionList.items ?? [];
  const totalPotentialLabel = useMemo(() => {
    if (!data?.actionList.totalPotential) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.actionList.currency,
      maximumFractionDigits: data.actionList.totalPotential >= 1000 ? 0 : 2,
    });
    return `${formatter.format(data.actionList.totalPotential)} projected`;
  }, [data?.actionList]);

  const graphNodes = data?.messagingArchitecture.nodes ?? getMessagingNodes();
  const graphLinks = data?.messagingArchitecture.links ?? getMessagingLinks();
  const insights = data?.insights ?? {
    title: 'Scale without breaking trust',
    description:
      'OnlyFans Assisted combines AI tone modelling, compliance guardrails, and human-in-the-loop handoffs so agencies can run thousands of conversations without risking creator accounts.',
    actionLabel: 'Configure assistant',
    actionHref: '/dashboard/onlyfans/settings',
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500">OnlyFans Control Room</p>
        <h1 className="text-3xl font-semibold text-gray-900">Grow messaging revenue without agency overhead</h1>
        <p className="max-w-2xl text-sm text-gray-600">
          Monitor smart replies, mass campaigns, and compliance guardrails in a single dashboard. Huntaze keeps
          creators protected while your team focuses on building long-term fan value.
        </p>
        {error ? (
          <p className="text-xs text-red-500">
            Unable to refresh dashboard data right now. Showing the most recent snapshot.
          </p>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {loading && !summaryCards.length ? (
          <>
            <ModuleCard.Skeleton key="card-skeleton-1" module="onlyfans" />
            <ModuleCard.Skeleton key="card-skeleton-2" module="onlyfans" />
            <ModuleCard.Skeleton key="card-skeleton-3" module="onlyfans" />
          </>
        ) : (
          summaryCards.map((card) => (
            <ModuleCard
              key={card.id}
              module="onlyfans"
              title={card.title}
              status={createModuleStatus(card.status)}
            >
              <p className="text-xs text-gray-600">{card.description}</p>
              <ul className="mt-4 space-y-1 text-xs text-gray-600">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </ModuleCard>
          ))
        )}
      </div>

      <ModuleCard
        module="onlyfans"
        title="Today&apos;s action list"
        status={createModuleStatus(actionItems.length ? 'active' : 'idle')}
        onAction={(action) => {
          if (action === 'refresh') {
            void refresh();
          }
        }}
      >
        <p className="text-xs text-gray-600">
          Huntaze prioritises the most profitable follow-ups with context, suggested scripts, and expected value.
          {totalPotentialLabel ? (
            <span className="ml-1 font-medium text-emerald-600">{totalPotentialLabel}</span>
          ) : null}
        </p>
        <div className="mt-4 rounded-xl border border-gray-200">
          {loading && !actionItems.length ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-64 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : actionItems.length ? (
            <VirtualizedList
              items={actionItems}
              height={200}
              itemHeight={64}
              module="onlyfans"
              overscan={3}
              renderItem={(item) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.title}{' '}
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                        {item.priority}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-emerald-600">{item.valueLabel}</span>
                </div>
              )}
            />
          ) : (
            <div className="p-4 text-xs text-gray-500">
              {error ? 'Unable to load action list data. Try refreshing the module.' : 'No actions queued for today. Check back later.'}
            </div>
          )}
        </div>
      </ModuleCard>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Messaging architecture</h2>
          <p className="mt-2 text-sm text-gray-600">
            The service mesh orchestrates AI agents, human fallbacks, and compliance checks before any fan sees a
            message.
          </p>
          <div className="mt-6">
            <ConnectorGraph
              hideStatus
              cardWidth={200}
              nodes={graphNodes}
              links={graphLinks}
            />
          </div>
        </div>
        <SectionExplainer
          title={insights.title}
          description={insights.description}
          actionLabel={insights.actionLabel}
          actionHref={insights.actionHref}
        />
      </section>
    </div>
  );
}

function getMessagingNodes(): NodeDef[] {
  return [
    { id: 'hub', title: 'Huntaze Core', x: 50, y: 45 },
    {
      id: 'ai',
      title: 'AI Replies',
      x: 20,
      y: 22,
      connectHref: '/of-connect',
      connectLabel: 'Connect OnlyFans',
    },
    {
      id: 'campaign',
      title: 'Campaign Engine',
      x: 80,
      y: 22,
      connectHref: '/of-connect',
      connectLabel: 'Connect OnlyFans',
    },
    {
      id: 'compliance',
      title: 'Compliance Review',
      x: 20,
      y: 75,
      connectHref: '/of-connect',
      connectLabel: 'Connect OnlyFans',
    },
    {
      id: 'humans',
      title: 'Human Team',
      x: 80,
      y: 75,
      connectHref: '/of-connect',
      connectLabel: 'Connect OnlyFans',
    },
  ];
}

function getMessagingLinks(): LinkDef[] {
  return [
    { from: 'hub', to: 'ai' },
    { from: 'hub', to: 'campaign' },
    { from: 'hub', to: 'compliance' },
    { from: 'hub', to: 'humans' },
    { from: 'compliance', to: 'humans' },
    { from: 'campaign', to: 'ai' },
  ];
}
