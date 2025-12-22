/**
 * Avatar, Icon & Status Tag Constants
 * Phase 10: SaaS-level density and polish
 * 
 * Following patterns from Intercom, Front, Help Scout, Crisp
 */

/**
 * Avatar sizes for different contexts
 * - list: Conversation list (36px) - Balance between recognition and density
 * - thread: Message thread (32px) - Compact to focus on messages
 * - profile: Context panel profile (80px) - Clear identification
 */
export const AVATAR_SIZES = {
  list: 36,
  thread: 32,
  profile: 80,
} as const;

/**
 * Icon button specifications
 * - iconSize: Visual size of SVG (20px)
 * - touchTarget: Clickable area (40px) - Meets WCAG 2.1 Level AAA
 * - padding: Padding around icon (10px) - Centers 20px icon in 40px area
 */
export const ICON_BUTTON = {
  iconSize: 20,
  touchTarget: 40,
  padding: 10,
} as const;

/**
 * Status tag color schemes with semantic meanings
 * All combinations meet WCAG AA standards (≥ 4.5:1 contrast)
 */
export const TAG_COLORS = {
  vip: {
    bg: '#FFF4E5',  // Warm light orange
    text: '#9A3412', // Dark orange/brown
    semantic: 'premium' as const,
  },
  fidele: {
    bg: '#E5F0FF',  // Calm light blue
    text: '#1D4ED8', // Deep blue
    semantic: 'loyalty' as const,
  },
  topfan: {
    bg: '#F3E8FF',  // Premium light violet
    text: '#7C3AED', // Rich purple
    semantic: 'engagement' as const,
  },
  nouveau: {
    bg: '#ECFDF3',  // Fresh light green
    text: '#166534', // Forest green
    semantic: 'new' as const,
  },
} as const;

/**
 * Status tag styling constants
 */
export const TAG_STYLES = {
  borderRadius: '999px',  // Pill shape
  fontSize: '11px',
  fontWeight: 500,
  paddingVertical: '2px',
  paddingHorizontal: '8px',
  gap: '4px',
  maxVisible: 2,  // Maximum visible tags before "+N" indicator
} as const;

// Type exports for TypeScript
export type AvatarSize = keyof typeof AVATAR_SIZES;
export type TagType = keyof typeof TAG_COLORS;
