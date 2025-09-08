'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type VirtualListProps<T> = {
  items: T[]
  itemHeight: number // px, fixed height rows
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function VirtualList<T>({ items, itemHeight, overscan = 6, renderItem, className = '', style }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(0)

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.clientHeight))
    ro.observe(el)
    setHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const total = items.length
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil((height || 1) / itemHeight) + overscan * 2
  const endIndex = Math.min(total, startIndex + visibleCount)

  const offsetY = startIndex * itemHeight
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex])

  return (
    <div ref={containerRef} onScroll={onScroll} className={`overflow-auto ${className}`} style={style}>
      <div style={{ height: total * itemHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VirtualList

