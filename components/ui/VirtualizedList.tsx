'use client';

import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import { useCallback, useMemo, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  module: string;
  overscan?: number;
}

type RowData<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  module: string;
};

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  module,
  overscan = 4,
}: VirtualizedListProps<T>) {
  const itemData = useMemo<RowData<T>>(() => ({ items, renderItem, module }), [items, renderItem, module]);

  const Row = useCallback(
    ({ index, style, data }: ListChildComponentProps<RowData<T>>) => {
      const { items: rowItems, renderItem: rowRenderer, module: moduleName } = data;
      return (
        <div
          style={style}
          className={cn(
            'border-b border-gray-100 px-3 py-2 text-sm text-gray-700',
            index % 2 === 0 ? 'bg-white/60' : 'bg-white',
            `virtualized-${moduleName}`,
          )}
        >
          {rowRenderer(rowItems[index], index)}
        </div>
      );
    },
    [],
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={overscan}
      itemData={itemData}
    >
      {Row}
    </List>
  );
}
