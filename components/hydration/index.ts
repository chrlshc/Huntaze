export { default as HydrationErrorBoundary } from './HydrationErrorBoundary';
export { default as HydrationProvider } from './HydrationProvider';
export { default as HydrationDebugPanel } from './HydrationDebugPanel';
export { HydrationDiffViewer } from './HydrationDiffViewer';

// Hydration-safe wrapper components
export { 
  HydrationSafeWrapper, 
  ClientOnly, 
  useHydration, 
  withHydrationSafety 
} from './HydrationSafeWrapper';

export { 
  SSRDataProvider, 
  useSSRData, 
  useSSRValue, 
  SSRValue, 
  withSSRData 
} from './SSRDataProvider';

export { 
  SafeDateRenderer, 
  SafeCurrentYear, 
  SafeRelativeTime 
} from './SafeDateRenderer';

export { 
  SafeBrowserAPI, 
  useSafeBrowserAPI, 
  SafeLocalStorage, 
  SafeScreenInfo, 
  SafeGeolocation 
} from './SafeBrowserAPI';

export { 
  SafeRandomContent, 
  SafeRandomChoice, 
  SafeShuffledList, 
  useSafeUniqueId, 
  SafeDelayedContent 
} from './SafeRandomContent';

export {
  SafeWindowAccess,
  useWindowSize,
  useWindowScroll,
  ResponsiveWrapper
} from './SafeWindowAccess';

export {
  SafeDocumentAccess,
  useDocumentTitle,
  useElement,
  SafeStyleInjector,
  SafeBodyClass
} from './SafeDocumentAccess';

export {
  SafeAnimationWrapper,
  SafeParticleSystem,
  useScrollAnimation,
  SafeScrollAnimation,
  SafeTypingEffect
} from './SafeAnimationWrapper';

export {
  HydrationRecoverySystem,
  useHydrationRecovery
} from './HydrationRecoverySystem';

export {
  HydrationHealthDashboard
} from './HydrationHealthDashboard';

export {
  HydrationNotificationSystem,
  useHydrationNotifications
} from './HydrationNotificationSystem';

// Re-export types and services
export type { HydrationError, HydrationErrorLogData } from '@/lib/services/hydrationErrorLogger';
export { hydrationErrorLogger } from '@/lib/services/hydrationErrorLogger';
export { useHydrationError, useHydrationDebug } from '@/hooks/useHydrationError';
export type { UseHydrationErrorReturn } from '@/hooks/useHydrationError';