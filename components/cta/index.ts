/**
 * CTA Components
 * 
 * Standardized Call-to-Action components for consistent UX across the application.
 * 
 * Key Features:
 * - Authentication-aware (shows "Join Beta" vs "Go to Dashboard")
 * - Consistent styling and behavior
 * - Microcopy support
 * - Max 2 CTAs per section enforcement
 * - Accessible (WCAG 2.0 AA compliant)
 * 
 * Usage Guidelines:
 * 1. Use StandardCTA for individual CTAs
 * 2. Use CTASection for pre-built CTA sections
 * 3. Always include microcopy for primary actions
 * 4. Never exceed 2 CTAs per section
 * 5. Use "Join Beta" as primary CTA text (default)
 * 6. Use "Learn More" or "View [Feature]" for secondary CTAs
 */

export { StandardCTA } from './StandardCTA';
export { CTASection } from './CTASection';
export type { CTAVariant, CTASize } from './StandardCTA';
