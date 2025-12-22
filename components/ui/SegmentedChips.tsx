'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type SegmentedChipsVariant = 'pills' | 'tabs';

export type SegmentedChipItem<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  count?: number;
  disabled?: boolean;
};

export type SegmentedChipsProps<T extends string = string> = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  items: readonly SegmentedChipItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  variant?: SegmentedChipsVariant;
};

export function SegmentedChips<T extends string = string>({
  items,
  value,
  onChange,
  size = 'md',
  variant = 'pills',
  className,
  onKeyDown,
  ...rest
}: SegmentedChipsProps<T>) {
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const tabsButtonClassName = size === 'sm' ? 'text-sm py-2' : 'text-base py-3';
  const tabsGapClassName = size === 'sm' ? 'gap-6 gap-y-2' : 'gap-8 gap-y-2';

  const pillDims =
    size === 'sm'
      ? { button: 'h-10 px-4 text-sm', badge: 'h-5 min-w-5 px-1.5 text-[11px]' }
      : { button: 'h-12 px-5 text-base', badge: 'h-6 min-w-6 px-2 text-xs' };
  const pillGapClassName = size === 'sm' ? 'gap-2' : 'gap-3';

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const currentIndex = items.findIndex((it) => it.value === value);
    if (currentIndex < 0) return;

    const nextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
      let i = startIndex;
      for (let steps = 0; steps < items.length; steps++) {
        i = (i + direction + items.length) % items.length;
        if (!items[i]?.disabled) return i;
      }
      return startIndex;
    };

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = nextEnabledIndex(currentIndex, 1);
      buttonRefs.current[nextIndex]?.focus();
      onChange(items[nextIndex]!.value);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const nextIndex = nextEnabledIndex(currentIndex, -1);
      buttonRefs.current[nextIndex]?.focus();
      onChange(items[nextIndex]!.value);
    }
  };

  if (variant === 'tabs') {
    return (
      <div
        role="tablist"
        aria-label="Segments"
        onKeyDown={handleKeyDown}
        className={cn('flex flex-wrap items-end border-b border-slate-200', tabsGapClassName, className)}
        {...rest}
      >
        {items.map((it, idx) => {
          const active = it.value === value;
          const count = it.count;

          return (
            <button
              key={it.value}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={it.disabled}
              onClick={() => {
                if (!it.disabled) onChange(it.value);
              }}
              className={cn(
                'relative -mb-px inline-flex min-h-0 items-center gap-2 whitespace-nowrap transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                tabsButtonClassName,
                active ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800',
                it.disabled && 'cursor-not-allowed opacity-50 hover:text-slate-500',
              )}
            >
              <span className="whitespace-nowrap">{it.label}</span>

              {typeof count === 'number' ? (
                <span
                  className={cn(
                    'tabular-nums font-semibold',
                    active ? 'text-slate-700' : 'text-slate-400',
                    count === 0 && 'opacity-60',
                  )}
                >
                  ({count})
                </span>
              ) : null}

              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 right-0 bottom-0 h-0.5 rounded-full transition-colors',
                  active ? 'bg-slate-900' : 'bg-slate-200',
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Segments"
      onKeyDown={handleKeyDown}
      className={cn('flex flex-wrap items-center', pillGapClassName, className)}
      {...rest}
    >
      {items.map((it, idx) => {
        const active = it.value === value;
        const count = it.count;

        return (
          <button
            key={it.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={it.disabled}
            onClick={() => {
              if (!it.disabled) onChange(it.value);
            }}
            className={cn(
              'group inline-flex min-h-0 items-center gap-2.5 whitespace-nowrap rounded-full border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              pillDims.button,
              active
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
              it.disabled && 'cursor-not-allowed opacity-50 hover:bg-white hover:border-slate-200',
            )}
          >
            {typeof count === 'number' ? (
              <>
                <span className="whitespace-nowrap">{it.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-full font-bold tabular-nums leading-none',
                    pillDims.badge,
                    active ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700',
                    count === 0 && 'opacity-60',
                  )}
                >
                  {count}
                </span>
              </>
            ) : (
              <span className="whitespace-nowrap">{it.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
