/**
 * Shopify Design System Components
 * 
 * A collection of UI components following Shopify Admin design patterns.
 * These components implement the light, clean aesthetic with:
 * - Light gray backgrounds (#f6f6f7)
 * - White cards with subtle shadows
 * - Clear typography hierarchy
 * - Consistent spacing and borders
 */

// Card Components
export { 
  ShopifyCard, 
  ShopifyCardSection,
  type ShopifyCardProps,
  type ShopifyCardSectionProps,
} from './ShopifyCard';

// Metric Components
export { 
  ShopifyMetricCard,
  ShopifyMetricGrid,
  type ShopifyMetricCardProps,
  type ShopifyMetricGridProps,
} from './ShopifyMetricCard';

// Section Header Components
export {
  ShopifySectionHeader,
  type ShopifySectionHeaderProps,
} from './ShopifySectionHeader';

// Banner Components
export {
  ShopifyBanner,
  type ShopifyBannerProps,
} from './ShopifyBanner';

// Quick Action Components
export {
  ShopifyQuickAction,
  type ShopifyQuickActionProps,
} from './ShopifyQuickAction';

// Feature Card Components
export {
  ShopifyFeatureCard,
  type ShopifyFeatureCardProps,
} from './ShopifyFeatureCard';

// Button Components
export {
  ShopifyButton,
  SHOPIFY_BUTTON_VARIANTS,
  SHOPIFY_BUTTON_SIZES,
  type ShopifyButtonProps,
  type ShopifyButtonVariant,
  type ShopifyButtonSize,
} from './ShopifyButton';

// Badge Components
export {
  ShopifyBadge,
  type ShopifyBadgeProps,
  type ShopifyBadgeTone,
  type ShopifyBadgeSize,
} from './ShopifyBadge';

// Table Components
export {
  ShopifyIndexTable,
  type ShopifyIndexTableProps,
  type ShopifyIndexTableColumn,
} from './ShopifyIndexTable';

// Empty State Components
export {
  ShopifyEmptyState,
  type ShopifyEmptyStateProps,
} from './ShopifyEmptyState';

// Connection Card Components
export {
  ShopifyConnectionCard,
  ConnectionIllustration,
  type ShopifyConnectionCardProps,
} from './ShopifyConnectionCard';
