"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VirtualListProps<T> = {
  items: T[];
  itemSize: number; // px, fixed height rows
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  className?: string;
};

export function VirtualList<T>({ items, itemSize, overscan = 4, renderRow, className = "" }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    setHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const total = items.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - overscan);
  const visibleCount = Math.ceil((height || 1) / itemSize) + overscan * 2;
  const endIndex = Math.min(total, startIndex + visibleCount);
  const offsetY = startIndex * itemSize;
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

  const ensureVisible = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rowTop = index * itemSize;
    const rowBottom = rowTop + itemSize;
    const viewTop = el.scrollTop;
    const viewBottom = viewTop + el.clientHeight;
    if (rowTop < viewTop) {
      el.scrollTop = rowTop;
    } else if (rowBottom > viewBottom) {
      el.scrollTop = rowBottom - el.clientHeight;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    let next = activeIndex < 0 ? 0 : activeIndex;
    switch (e.key) {
      case "ArrowDown":
        next = Math.min(items.length - 1, (activeIndex < 0 ? -1 : activeIndex) + 1);
        break;
      case "ArrowUp":
        next = Math.max(0, (activeIndex < 0 ? 0 : activeIndex) - 1);
        break;
      case "PageDown":
        next = Math.min(items.length - 1, (activeIndex < 0 ? 0 : activeIndex) + Math.max(1, Math.floor((height || itemSize) / itemSize)));
        break;
      case "PageUp":
        next = Math.max(0, (activeIndex < 0 ? 0 : activeIndex) - Math.max(1, Math.floor((height || itemSize) / itemSize)));
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    setActiveIndex(next);
    ensureVisible(next);
    // Move DOM focus to the active row for SR friendliness
    const rowEl = document.getElementById(`vl-row-${next}`);
    rowEl?.focus();
  };

  if (items.length === 0) {
    return (
      <div
        className={`overflow-auto ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Empty list"
        tabIndex={0}
      >
        <div className="p-8 text-center text-gray-600 dark:text-gray-400">No items</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={`overflow-auto ${className}`}
      style={{ position: "relative" }}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="list"
    >
      <div style={{ height: total * itemSize, position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => {
            const realIndex = startIndex + i;
            const selected = realIndex === activeIndex;
            return (
              <div
                key={realIndex}
                id={`vl-row-${realIndex}`}
                role="listitem"
                tabIndex={selected ? 0 : -1}
                style={{ height: itemSize }}
                className={selected ? "bg-purple-50 dark:bg-purple-900/20" : undefined}
              >
                {renderRow(item, realIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
