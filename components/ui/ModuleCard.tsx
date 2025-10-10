'use client';

import { forwardRef, memo, useCallback, useMemo } from 'react';
import type { ComponentProps } from 'react';

import type { HuntazeModule } from '@/contexts/AppStateContext';
import { cn } from '@/lib/utils';
import { readModuleStatus, createModuleStatus, type ModuleStatus } from '@/types/branded';

const moduleClassName: Record<HuntazeModule, string> = {
  home: 'border border-gray-200 bg-white shadow-sm hover:border-gray-300 focus-visible:ring-gray-900/10',
  onlyfans:
    'border-l-4 border-[#FF6B6B] bg-[#FFF5F5] hover:border-[#FF8787] focus-visible:ring-[#FF6B6B]/20',
  social:
    'border-l-4 border-[#4ECDC4] bg-[#F3FFFD] hover:border-[#6EE7D8] focus-visible:ring-[#4ECDC4]/20',
  analytics:
    'border-l-4 border-[#45B7D1] bg-[#F0FAFF] hover:border-[#63C4DE] focus-visible:ring-[#45B7D1]/20',
  'cin-ai':
    'border-l-4 border-[#96CEB4] bg-[#F7FFF9] hover:border-[#B1E6CB] focus-visible:ring-[#96CEB4]/20',
  settings:
    'border-l-4 border-gray-300 bg-white hover:border-gray-400 focus-visible:ring-gray-500/20',
};

type ModuleCardProps = ComponentProps<'div'> & {
  module: HuntazeModule;
  title: string;
  status?: ModuleStatus | 'active' | 'idle' | 'error';
  data?: { metrics?: Record<string, number> };
  onAction?: (action: string) => void;
};

function deriveStatus(status?: ModuleStatus | 'active' | 'idle' | 'error'): ModuleStatus {
  if (!status) return createModuleStatus('active');
  if (typeof status === 'string') return createModuleStatus(status);
  return status;
}

function deriveHeadlineMetrics(metrics?: Record<string, number>) {
  if (!metrics) return null;
  const entries = Object.entries(metrics).slice(0, 3);
  const total = entries.reduce((acc, [, value]) => acc + value, 0);
  return { entries, total };
}

const ModuleCardBase = forwardRef<HTMLDivElement, ModuleCardProps>(function ModuleCardBase(
  { module, title, status, className, data, children, onAction, ...props },
  ref,
) {
  const derivedStatus = deriveStatus(status);
  const statusValue = readModuleStatus(derivedStatus);
  const statusDot =
    statusValue === 'error'
      ? 'bg-red-500'
      : statusValue === 'idle'
        ? 'bg-yellow-500'
        : 'bg-emerald-500';

  const metrics = useMemo(() => deriveHeadlineMetrics(data?.metrics), [data?.metrics]);

  const emitAction = useCallback(
    (action: string) => {
      onAction?.(action);
    },
    [onAction],
  );

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl p-5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2',
        moduleClassName[module],
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className={cn('h-2.5 w-2.5 rounded-full', statusDot)} aria-hidden="true" />
      </div>

      {metrics ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <dt className="font-medium text-gray-700">Signals</dt>
            <dd>{metrics.entries.length}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Aggregate</dt>
            <dd>{metrics.total}</dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-3 text-sm text-gray-700">{children}</div>

      {onAction ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => emitAction('refresh')}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => emitAction('open')}
            className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow hover:bg-gray-800"
          >
            Open module
          </button>
        </div>
      ) : null}
    </div>
  );
});

function areEqual(prev: ModuleCardProps, next: ModuleCardProps) {
  const prevStatus =
    typeof prev.status === 'string'
      ? prev.status
      : prev.status
        ? readModuleStatus(prev.status)
        : 'active';
  const nextStatus =
    typeof next.status === 'string'
      ? next.status
      : next.status
        ? readModuleStatus(next.status)
        : 'active';

  return (
    prev.module === next.module &&
    prev.title === next.title &&
    prevStatus === nextStatus &&
    prev.data === next.data &&
    prev.children === next.children
  );
}

const MemoizedModuleCard = memo(ModuleCardBase, areEqual);

type ModuleCardComponent = typeof MemoizedModuleCard & {
  Skeleton: (props: { module: HuntazeModule }) => JSX.Element;
};

export const ModuleCard = MemoizedModuleCard as ModuleCardComponent;

ModuleCard.Skeleton = function ModuleCardSkeleton({ module }: { module: HuntazeModule }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl border border-dashed border-gray-200 bg-white/60 p-5',
        moduleClassName[module],
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/5 rounded bg-gray-200" />
        <div className="h-3 w-2/5 rounded bg-gray-200" />
      </div>
    </div>
  );
};
