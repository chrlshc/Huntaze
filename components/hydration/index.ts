/**
 * Hydration-Safe Components
 * 
 * Collection of components that prevent React hydration mismatches
 * between server and client rendering.
 */

export {
  HydrationSafeWrapper,
  ClientOnly,
  SafeBrowserAPI,
  SafeCurrentYear,
  SafeRandomContent,
  SafeConditionalRender,
} from './HydrationSafeWrapper';

export {
  SafeBadge,
  SafeUnreadBadge,
  SafeNotificationBadge,
} from './SafeBadge';

export {
  SafeDateRenderer,
  SafeTimestamp,
} from './SafeDateRenderer';

export {
  SSRDataProvider,
  useSSRData,
  useHydrationSafeState,
  withSSRData,
} from './SSRDataProvider';

export { default as HydrationErrorBoundary } from './HydrationErrorBoundary';
