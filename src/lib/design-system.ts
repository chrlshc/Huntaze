// Material Design 3 Inspired Design System for Huntaze
// Based on SaaS best practices analysis

export const designTokens = {
  // Color System - Material You inspired
  colors: {
    primary: {
      0: '#000000',
      10: '#21005D',
      20: '#381E72',
      30: '#4F378B',
      40: '#6750A4',
      50: '#7F67BE',
      60: '#9A82DB',
      70: '#B69DF8',
      80: '#D0BCFF',
      90: '#EADDFF',
      95: '#F6EDFF',
      99: '#FFFBFE',
      100: '#FFFFFF',
    },
    secondary: {
      0: '#000000',
      10: '#1D192B',
      20: '#332D41',
      30: '#4A4458',
      40: '#625B71',
      50: '#7A7289',
      60: '#958DA5',
      70: '#B0A7C0',
      80: '#CCC2DC',
      90: '#E8DEF8',
      95: '#F6EDFF',
      99: '#FFFBFE',
      100: '#FFFFFF',
    },
    tertiary: {
      0: '#000000',
      10: '#31111D',
      20: '#492532',
      30: '#633B48',
      40: '#7D5260',
      50: '#986977',
      60: '#B58392',
      70: '#D29DAC',
      80: '#EFB8C8',
      90: '#FFD8E4',
      95: '#FFECF1',
      99: '#FFFBFA',
      100: '#FFFFFF',
    },
    error: {
      0: '#000000',
      10: '#410002',
      20: '#690005',
      30: '#93000A',
      40: '#BA1A1A',
      50: '#DE3730',
      60: '#FF5449',
      70: '#FF897D',
      80: '#FFB4AB',
      90: '#FFDAD6',
      95: '#FFEDEA',
      99: '#FFFBFF',
      100: '#FFFFFF',
    },
    neutral: {
      0: '#000000',
      10: '#1C1B1F',
      20: '#313033',
      30: '#484649',
      40: '#605D62',
      50: '#787579',
      60: '#939094',
      70: '#AEAAAE',
      80: '#C9C5CA',
      90: '#E6E1E5',
      95: '#F4EFF4',
      99: '#FFFBFE',
      100: '#FFFFFF',
    },
    surface: {
      dim: '#DED8E2',
      default: '#FEF7FF',
      bright: '#FEF7FF',
      containerLowest: '#FFFFFF',
      containerLow: '#F8F2FA',
      container: '#F3EDF5',
      containerHigh: '#EDE7F0',
      containerHighest: '#E7E0EA',
    },
  },

  // Elevation System - Material Design 3
  elevation: {
    level0: 'none',
    level1: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    level2: '0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    level3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
    level4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
    level5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
  },

  // Typography Scale - Material Design 3
  typography: {
    displayLarge: {
      fontSize: '57px',
      lineHeight: '64px',
      letterSpacing: '-0.25px',
      fontWeight: 400,
    },
    displayMedium: {
      fontSize: '45px',
      lineHeight: '52px',
      letterSpacing: '0px',
      fontWeight: 400,
    },
    displaySmall: {
      fontSize: '36px',
      lineHeight: '44px',
      letterSpacing: '0px',
      fontWeight: 400,
    },
    headlineLarge: {
      fontSize: '32px',
      lineHeight: '40px',
      letterSpacing: '0px',
      fontWeight: 400,
    },
    headlineMedium: {
      fontSize: '28px',
      lineHeight: '36px',
      letterSpacing: '0px',
      fontWeight: 400,
    },
    headlineSmall: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '0px',
      fontWeight: 400,
    },
    titleLarge: {
      fontSize: '22px',
      lineHeight: '28px',
      letterSpacing: '0px',
      fontWeight: 400,
    },
    titleMedium: {
      fontSize: '16px',
      lineHeight: '24px',
      letterSpacing: '0.15px',
      fontWeight: 500,
    },
    titleSmall: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0.1px',
      fontWeight: 500,
    },
    bodyLarge: {
      fontSize: '16px',
      lineHeight: '24px',
      letterSpacing: '0.5px',
      fontWeight: 400,
    },
    bodyMedium: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0.25px',
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: '12px',
      lineHeight: '16px',
      letterSpacing: '0.4px',
      fontWeight: 400,
    },
    labelLarge: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0.1px',
      fontWeight: 500,
    },
    labelMedium: {
      fontSize: '12px',
      lineHeight: '16px',
      letterSpacing: '0.5px',
      fontWeight: 500,
    },
    labelSmall: {
      fontSize: '11px',
      lineHeight: '16px',
      letterSpacing: '0.5px',
      fontWeight: 500,
    },
  },

  // Shape System - Material Design 3
  shape: {
    none: '0px',
    extraSmall: '4px',
    small: '8px',
    medium: '12px',
    large: '16px',
    extraLarge: '28px',
    full: '9999px',
  },

  // Motion - Material Design 3
  motion: {
    duration: {
      short1: '50ms',
      short2: '100ms',
      short3: '150ms',
      short4: '200ms',
      medium1: '250ms',
      medium2: '300ms',
      medium3: '350ms',
      medium4: '400ms',
      long1: '450ms',
      long2: '500ms',
      long3: '550ms',
      long4: '600ms',
    },
    easing: {
      linear: 'cubic-bezier(0, 0, 1, 1)',
      standard: 'cubic-bezier(0.2, 0, 0, 1)',
      standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
      standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
      emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
      emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
      emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    },
  },

  // Spacing Scale - 8pt grid system
  spacing: {
    0: '0px',
    1: '8px',
    2: '16px',
    3: '24px',
    4: '32px',
    5: '40px',
    6: '48px',
    7: '56px',
    8: '64px',
    9: '72px',
    10: '80px',
    11: '88px',
    12: '96px',
  },

  // State Layer Opacity - Material Design 3
  state: {
    hover: 0.08,
    focus: 0.12,
    pressed: 0.12,
    dragged: 0.16,
  },
};

// Component Classes - Material Design 3
export const components = {
  // Primary Button
  button: {
    primary: `
      px-6 py-3 rounded-full
      bg-purple-600 text-white font-medium
      hover:bg-purple-700 hover:shadow-md
      active:shadow-sm
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2
      transition-all duration-200 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      px-6 py-3 rounded-full
      bg-purple-100 text-purple-900 font-medium
      hover:bg-purple-200
      active:bg-purple-300
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2
      transition-all duration-200 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    outlined: `
      px-6 py-3 rounded-full
      border border-purple-600 text-purple-600 font-medium
      hover:bg-purple-50
      active:bg-purple-100
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2
      transition-all duration-200 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    text: `
      px-4 py-2 rounded-lg
      text-purple-600 font-medium
      hover:bg-purple-50
      active:bg-purple-100
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2
      transition-all duration-200 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  },

  // Cards - Material Design 3
  card: {
    elevated: `
      bg-white dark:bg-gray-900
      rounded-xl shadow-sm
      border border-gray-200 dark:border-gray-800
      transition-shadow duration-200
      hover:shadow-md
    `,
    filled: `
      bg-purple-50 dark:bg-purple-900/20
      rounded-xl
      transition-colors duration-200
    `,
    outlined: `
      bg-white dark:bg-gray-900
      rounded-xl
      border border-gray-300 dark:border-gray-700
      transition-colors duration-200
    `,
  },

  // Input Fields - Material Design 3
  input: {
    filled: `
      w-full px-4 pt-5 pb-2
      bg-gray-100 dark:bg-gray-800
      rounded-t-lg border-b-2 border-gray-300 dark:border-gray-600
      focus:border-purple-600 focus:outline-none
      transition-colors duration-200
      placeholder-transparent
    `,
    outlined: `
      w-full px-4 py-3
      bg-transparent
      rounded-lg border border-gray-300 dark:border-gray-600
      focus:border-purple-600 focus:outline-none
      transition-colors duration-200
    `,
  },

  // Chips - Material Design 3
  chip: {
    base: `
      inline-flex items-center gap-2
      px-4 py-2 rounded-full
      text-sm font-medium
      transition-all duration-200
    `,
    filled: `
      bg-purple-100 text-purple-900
      hover:bg-purple-200
    `,
    outlined: `
      border border-gray-300 text-gray-700
      hover:bg-gray-50
    `,
  },

  // Navigation - Material Design 3
  navigation: {
    rail: `
      w-20 h-full
      bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-800
      flex flex-col items-center py-4
    `,
    drawer: `
      w-80 h-full
      bg-white dark:bg-gray-900
      shadow-xl
      transform transition-transform duration-300
    `,
  },

  // FAB - Material Design 3
  fab: {
    primary: `
      fixed bottom-4 right-4
      w-14 h-14 rounded-2xl
      bg-purple-600 text-white
      shadow-lg hover:shadow-xl
      flex items-center justify-center
      transition-all duration-200
      active:scale-95
    `,
    extended: `
      fixed bottom-4 right-4
      px-6 h-14 rounded-2xl
      bg-purple-600 text-white
      shadow-lg hover:shadow-xl
      flex items-center gap-2
      transition-all duration-200
      active:scale-95
    `,
  },
};

// Utility Functions
export const getElevation = (level: keyof typeof designTokens.elevation) => {
  return designTokens.elevation[level];
};

export const getColor = (
  colorName: keyof typeof designTokens.colors,
  shade: number | string
) => {
  const colorGroup = designTokens.colors[colorName];
  if (typeof colorGroup === 'object' && shade in colorGroup) {
    return colorGroup[shade as keyof typeof colorGroup];
  }
  return null;
};

export const getTypography = (variant: keyof typeof designTokens.typography) => {
  return designTokens.typography[variant];
};

// Material Design 3 Dynamic Color Theme
export const dynamicTheme = {
  light: {
    primary: designTokens.colors.primary[40],
    onPrimary: designTokens.colors.primary[100],
    primaryContainer: designTokens.colors.primary[90],
    onPrimaryContainer: designTokens.colors.primary[10],
    secondary: designTokens.colors.secondary[40],
    onSecondary: designTokens.colors.secondary[100],
    secondaryContainer: designTokens.colors.secondary[90],
    onSecondaryContainer: designTokens.colors.secondary[10],
    tertiary: designTokens.colors.tertiary[40],
    onTertiary: designTokens.colors.tertiary[100],
    tertiaryContainer: designTokens.colors.tertiary[90],
    onTertiaryContainer: designTokens.colors.tertiary[10],
    error: designTokens.colors.error[40],
    onError: designTokens.colors.error[100],
    errorContainer: designTokens.colors.error[90],
    onErrorContainer: designTokens.colors.error[10],
    background: designTokens.colors.neutral[99],
    onBackground: designTokens.colors.neutral[10],
    surface: designTokens.colors.neutral[99],
    onSurface: designTokens.colors.neutral[10],
    surfaceVariant: designTokens.colors.neutral[90],
    onSurfaceVariant: designTokens.colors.neutral[30],
    outline: designTokens.colors.neutral[50],
    outlineVariant: designTokens.colors.neutral[80],
  },
  dark: {
    primary: designTokens.colors.primary[80],
    onPrimary: designTokens.colors.primary[20],
    primaryContainer: designTokens.colors.primary[30],
    onPrimaryContainer: designTokens.colors.primary[90],
    secondary: designTokens.colors.secondary[80],
    onSecondary: designTokens.colors.secondary[20],
    secondaryContainer: designTokens.colors.secondary[30],
    onSecondaryContainer: designTokens.colors.secondary[90],
    tertiary: designTokens.colors.tertiary[80],
    onTertiary: designTokens.colors.tertiary[20],
    tertiaryContainer: designTokens.colors.tertiary[30],
    onTertiaryContainer: designTokens.colors.tertiary[90],
    error: designTokens.colors.error[80],
    onError: designTokens.colors.error[20],
    errorContainer: designTokens.colors.error[30],
    onErrorContainer: designTokens.colors.error[90],
    background: designTokens.colors.neutral[10],
    onBackground: designTokens.colors.neutral[90],
    surface: designTokens.colors.neutral[10],
    onSurface: designTokens.colors.neutral[90],
    surfaceVariant: designTokens.colors.neutral[30],
    onSurfaceVariant: designTokens.colors.neutral[80],
    outline: designTokens.colors.neutral[60],
    outlineVariant: designTokens.colors.neutral[30],
  },
};

export default designTokens;