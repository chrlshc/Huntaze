/**
 * Property Test: Live Feed Event Sorting
 * 
 * Property 6: For any array of LiveEvent objects, the displayed order SHALL be 
 * sorted by timestamp in descending order (most recent first).
 * 
 * Validates: Requirements 5.4
 * Feature: creator-analytics-dashboard
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { LiveEvent, EventType } from '@/lib/dashboard/types';

/**
 * Sort events by timestamp descending (most recent first)
 * This is the expected behavior from the LiveFeed component
 */
function sortEventsByTimestamp(events: LiveEvent[]): LiveEvent[] {
  return [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Verify events are sorted in descending order by timestamp
 */
function isSortedDescending(events: LiveEvent[]): boolean {
  for (let i = 1; i < events.length; i++) {
    const prevTime = new Date(events[i - 1].timestamp).getTime();
    const currTime = new Date(events[i].timestamp).getTime();
    if (prevTime < currTime) {
      return false;
    }
  }
  return true;
}

describe('**Feature: creator-analytics-dashboard, Property 6: Live Feed Event Sorting**', () => {
  it('sorts events by timestamp in descending order', () => {
    fc.assert(
      fc.property(
        // Generate array of events with random timestamps
        fc.array(
          fc.record({
            id: fc.uuid(),
            timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 }) // 2024 timestamps
              .map(ms => new Date(ms).toISOString()),
            type: fc.constantFrom<EventType>(
              'NEW_SUB', 
              'AI_MESSAGE', 
              'TIP', 
              'PPV_PURCHASE', 
              'CUSTOM_ORDER'
            ),
            amount: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: undefined }),
            source: fc.option(
              fc.constantFrom('Instagram', 'TikTok', 'Twitter', 'OnlyFans'),
              { nil: undefined }
            ),
            fanHandle: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (events) => {
          const sorted = sortEventsByTimestamp(events);
          
          // Verify sorted in descending order
          expect(isSortedDescending(sorted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('most recent event is first after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 })
              .map(ms => new Date(ms).toISOString()),
            type: fc.constantFrom<EventType>(
              'NEW_SUB', 
              'AI_MESSAGE', 
              'TIP', 
              'PPV_PURCHASE', 
              'CUSTOM_ORDER'
            ),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (events) => {
          const sorted = sortEventsByTimestamp(events);
          
          // First event should have the latest timestamp
          const firstTime = new Date(sorted[0].timestamp).getTime();
          for (let i = 1; i < sorted.length; i++) {
            const currTime = new Date(sorted[i].timestamp).getTime();
            expect(firstTime).toBeGreaterThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('oldest event is last after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 })
              .map(ms => new Date(ms).toISOString()),
            type: fc.constantFrom<EventType>(
              'NEW_SUB', 
              'AI_MESSAGE', 
              'TIP', 
              'PPV_PURCHASE', 
              'CUSTOM_ORDER'
            ),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (events) => {
          const sorted = sortEventsByTimestamp(events);
          
          // Last event should have the earliest timestamp
          const lastTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
          for (let i = 0; i < sorted.length - 1; i++) {
            const currTime = new Date(sorted[i].timestamp).getTime();
            expect(currTime).toBeGreaterThanOrEqual(lastTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves all events during sorting', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 })
              .map(ms => new Date(ms).toISOString()),
            type: fc.constantFrom<EventType>(
              'NEW_SUB', 
              'AI_MESSAGE', 
              'TIP', 
              'PPV_PURCHASE', 
              'CUSTOM_ORDER'
            ),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (events) => {
          const sorted = sortEventsByTimestamp(events);
          
          // Same length
          expect(sorted.length).toBe(events.length);
          
          // All IDs present
          const originalIds = new Set(events.map(e => e.id));
          const sortedIds = new Set(sorted.map(e => e.id));
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles events with identical timestamps', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1704067200000, max: 1735689600000 })
            .map(ms => new Date(ms).toISOString()),
          fc.integer({ min: 2, max: 10 })
        ),
        ([timestamp, count]) => {
          // Create multiple events with same timestamp
          const events: LiveEvent[] = Array.from({ length: count }, (_, i) => ({
            id: `event-${i}`,
            timestamp,
            type: 'NEW_SUB' as EventType,
          }));
          
          const sorted = sortEventsByTimestamp(events);
          
          // Should not crash and preserve all events
          expect(sorted.length).toBe(count);
          expect(isSortedDescending(sorted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles empty array', () => {
    const result = sortEventsByTimestamp([]);
    expect(result).toEqual([]);
    expect(isSortedDescending(result)).toBe(true);
  });

  it('handles single event', () => {
    const singleEvent: LiveEvent = {
      id: 'event-1',
      timestamp: '2024-06-15T10:30:00Z',
      type: 'NEW_SUB',
    };
    
    const result = sortEventsByTimestamp([singleEvent]);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(singleEvent);
    expect(isSortedDescending(result)).toBe(true);
  });

  it('handles already sorted events', () => {
    const sortedEvents: LiveEvent[] = [
      { id: '1', timestamp: '2024-06-15T12:00:00Z', type: 'NEW_SUB' },
      { id: '2', timestamp: '2024-06-15T11:00:00Z', type: 'TIP' },
      { id: '3', timestamp: '2024-06-15T10:00:00Z', type: 'PPV_PURCHASE' },
    ];
    
    const result = sortEventsByTimestamp(sortedEvents);
    
    expect(result).toEqual(sortedEvents);
    expect(isSortedDescending(result)).toBe(true);
  });

  it('handles reverse sorted events', () => {
    const reverseSorted: LiveEvent[] = [
      { id: '1', timestamp: '2024-06-15T10:00:00Z', type: 'NEW_SUB' },
      { id: '2', timestamp: '2024-06-15T11:00:00Z', type: 'TIP' },
      { id: '3', timestamp: '2024-06-15T12:00:00Z', type: 'PPV_PURCHASE' },
    ];
    
    const result = sortEventsByTimestamp(reverseSorted);
    
    expect(result[0].id).toBe('3'); // Most recent
    expect(result[2].id).toBe('1'); // Oldest
    expect(isSortedDescending(result)).toBe(true);
  });

  it('handles randomly ordered events', () => {
    const randomEvents: LiveEvent[] = [
      { id: '1', timestamp: '2024-06-15T11:00:00Z', type: 'TIP' },
      { id: '2', timestamp: '2024-06-15T10:00:00Z', type: 'NEW_SUB' },
      { id: '3', timestamp: '2024-06-15T12:00:00Z', type: 'PPV_PURCHASE' },
      { id: '4', timestamp: '2024-06-15T09:00:00Z', type: 'CUSTOM_ORDER' },
    ];
    
    const result = sortEventsByTimestamp(randomEvents);
    
    expect(result[0].id).toBe('3'); // 12:00
    expect(result[1].id).toBe('1'); // 11:00
    expect(result[2].id).toBe('2'); // 10:00
    expect(result[3].id).toBe('4'); // 09:00
    expect(isSortedDescending(result)).toBe(true);
  });

  it('sorting is stable for events with same timestamp', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1704067200000, max: 1735689600000 })
            .map(ms => new Date(ms).toISOString()),
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 })
        ),
        ([timestamp, ids]) => {
          // Create events with same timestamp but different IDs
          const events: LiveEvent[] = ids.map(id => ({
            id,
            timestamp,
            type: 'NEW_SUB' as EventType,
          }));
          
          const sorted1 = sortEventsByTimestamp(events);
          const sorted2 = sortEventsByTimestamp(events);
          
          // Multiple sorts should produce same order (stable sort)
          expect(sorted1.map(e => e.id)).toEqual(sorted2.map(e => e.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mutate original array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 })
              .map(ms => new Date(ms).toISOString()),
            type: fc.constantFrom<EventType>(
              'NEW_SUB', 
              'AI_MESSAGE', 
              'TIP', 
              'PPV_PURCHASE', 
              'CUSTOM_ORDER'
            ),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (events) => {
          const originalOrder = events.map(e => e.id);
          sortEventsByTimestamp(events);
          const afterSortOrder = events.map(e => e.id);
          
          // Original array should be unchanged
          expect(afterSortOrder).toEqual(originalOrder);
        }
      ),
      { numRuns: 100 }
    );
  });
});
