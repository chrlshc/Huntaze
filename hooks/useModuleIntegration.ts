"use client";

import { useEffect, useMemo, useState } from 'react';

import { useAppState, type HuntazeModule, type HuntazeRealtimeEvent } from '@/contexts/AppStateContext';

interface UseModuleIntegrationOptions<TData> {
  module: HuntazeModule;
  initialData?: TData;
  selector?: (event: HuntazeRealtimeEvent) => boolean;
}

export function useModuleIntegration<TData = unknown>({
  module,
  initialData,
  selector,
}: UseModuleIntegrationOptions<TData>) {
  const { realTimeEvents } = useAppState();
  const [moduleData, setModuleData] = useState<TData | undefined>(initialData);

  const moduleEvents = useMemo(() => {
    return realTimeEvents.filter((event) => {
      const matchesModule =
        event.targetModule === module || (!event.targetModule && event.source === module);
      return matchesModule && (selector ? selector(event) : true);
    });
  }, [module, realTimeEvents, selector]);

  useEffect(() => {
    if (!moduleEvents.length) return;
    setModuleData((prev) => {
      const reducer = moduleEvents[moduleEvents.length - 1];
      const nextPayload = reducer.payload as TData;
      if (nextPayload === prev) return prev;
      return nextPayload;
    });
  }, [moduleEvents]);

  return {
    moduleData,
    setModuleData,
    events: moduleEvents,
  };
}
