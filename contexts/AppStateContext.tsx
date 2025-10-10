'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type HuntazeModule = 'home' | 'onlyfans' | 'social' | 'analytics' | 'cin-ai' | 'settings';

export interface HuntazeNotification {
  id: string;
  module: HuntazeModule;
  title: string;
  description?: string;
  createdAt: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export interface HuntazeRealtimeEvent {
  id: string;
  source: HuntazeModule;
  targetModule?: HuntazeModule;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface AppStateValue {
  activeModule: HuntazeModule;
  setActiveModule: (module: HuntazeModule) => void;
  notifications: HuntazeNotification[];
  addNotification: (notification: HuntazeNotification) => void;
  removeNotification: (id: string) => void;
  realTimeEvents: HuntazeRealtimeEvent[];
  pushEvent: (event: HuntazeRealtimeEvent) => void;
}

const defaultValue: AppStateValue = {
  activeModule: 'home',
  setActiveModule: () => undefined,
  notifications: [],
  addNotification: () => undefined,
  removeNotification: () => undefined,
  realTimeEvents: [],
  pushEvent: () => undefined,
};

export const AppStateContext = createContext<AppStateValue>(defaultValue);

interface AppStateProviderProps {
  initialModule?: HuntazeModule;
  children: ReactNode;
}

export function AppStateProvider({ initialModule = 'home', children }: AppStateProviderProps) {
  const [activeModule, setActiveModule] = useState<HuntazeModule>(initialModule);
  const [notifications, setNotifications] = useState<HuntazeNotification[]>([]);
  const [realTimeEvents, setRealTimeEvents] = useState<HuntazeRealtimeEvent[]>([]);

  const value = useMemo<AppStateValue>(
    () => ({
      activeModule,
      setActiveModule,
      notifications,
      addNotification: (notification) =>
        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev].slice(0, 40);
        }),
      removeNotification: (id) => setNotifications((prev) => prev.filter((item) => item.id !== id)),
      realTimeEvents,
      pushEvent: (event) =>
        setRealTimeEvents((prev) => {
          const exists = prev.some((item) => item.id === event.id);
          if (exists) return prev;
          return [event, ...prev].slice(0, 100);
        }),
    }),
    [activeModule, notifications, realTimeEvents],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
