// Système d'espacement cohérent pour Huntaze
// Basé sur une échelle de 4px (0.25rem)

export const spacing = {
  // Micro espacements
  xs: 'space-y-2',    // 8px
  sm: 'space-y-3',    // 12px
  
  // Espacements standards
  base: 'space-y-4',  // 16px
  md: 'space-y-6',    // 24px
  lg: 'space-y-8',    // 32px
  xl: 'space-y-12',   // 48px
  
  // Macro espacements
  '2xl': 'space-y-16', // 64px
  '3xl': 'space-y-20', // 80px
  '4xl': 'space-y-24', // 96px
} as const

export const padding = {
  // Paddings pour conteneurs
  card: 'p-6',        // 24px
  section: 'p-8',     // 32px
  hero: 'py-20',      // 80px vertical
  
  // Paddings responsifs
  responsive: {
    card: 'p-4 md:p-6',
    section: 'p-6 md:p-8',
    hero: 'py-16 md:py-20',
  }
} as const

export const gap = {
  // Gaps pour grilles et flex
  tight: 'gap-2',     // 8px
  base: 'gap-4',      // 16px
  relaxed: 'gap-6',   // 24px
  loose: 'gap-8',     // 32px
} as const

export const margin = {
  // Marges entre sections
  section: 'mt-16 md:mt-20', // 64px mobile, 80px desktop
  subsection: 'mt-8 md:mt-12', // 32px mobile, 48px desktop
  element: 'mt-4 md:mt-6', // 16px mobile, 24px desktop
} as const

// Helper pour appliquer un espacement cohérent
export const applySpacing = (type: keyof typeof spacing) => spacing[type]
export const applyPadding = (type: keyof typeof padding) => padding[type]
export const applyGap = (type: keyof typeof gap) => gap[type]
export const applyMargin = (type: keyof typeof margin) => margin[type]