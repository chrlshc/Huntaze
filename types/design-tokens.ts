/**
 * Design Token Type Definitions
 * Linear UI Performance Refactor
 * 
 * These types match the CSS custom properties defined in linear-design-tokens.css
 */

export interface DesignTokens {
  colors: {
    background: {
      app: string;      // #0F0F10
      surface: string;  // #151516
      hover: string;    // #1A1A1C
      input: string;    // #18181A
    };
    border: {
      subtle: string;   // #2E2E33
      emphasis: string; // #3E3E43
      focus: string;    // #7D57C1
    };
    accent: {
      primary: string;  // #7D57C1
      hover: string;    // #6B47AF
      active: string;   // #5A3A9D
    };
    text: {
      primary: string;   // #EDEDEF
      secondary: string; // #8A8F98
      muted: string;     // #6B7280
      inverse: string;   // #0F0F10
    };
    semantic: {
      success: string;  // #10B981
      warning: string;  // #F59E0B
      error: string;    // #EF4444
      info: string;     // #3B82F6
    };
  };
  typography: {
    fontFamily: {
      base: string;     // 'Inter', sans-serif
      mono: string;     // 'SF Mono', Monaco, monospace
    };
    weights: {
      regular: number;  // 400
      medium: number;   // 500
    };
    sizes: {
      xs: string;       // 0.75rem (12px)
      sm: string;       // 0.875rem (14px)
      base: string;     // 1rem (16px)
      lg: string;       // 1.125rem (18px)
      xl: string;       // 1.25rem (20px)
      '2xl': string;    // 1.5rem (24px)
      '3xl': string;    // 1.875rem (30px)
      '4xl': string;    // 2.25rem (36px)
    };
    lineHeights: {
      tight: number;    // 1.25
      normal: number;   // 1.5
      relaxed: number;  // 1.75
    };
  };
  spacing: {
    unit: number;       // 4px base unit
    scale: number[];    // [0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96]
  };
  components: {
    input: {
      heightDense: string;    // 2rem (32px)
      heightStandard: string; // 2.5rem (40px)
      paddingX: string;       // var(--spacing-3)
      paddingY: string;       // var(--spacing-2)
      borderWidth: string;    // 1px
      borderRadius: string;   // 0.375rem (6px)
    };
    button: {
      heightDense: string;    // 2rem (32px)
      heightStandard: string; // 2.5rem (40px)
      paddingX: string;       // var(--spacing-4)
      paddingY: string;       // var(--spacing-2)
      borderRadius: string;   // 0.375rem (6px)
    };
    border: {
      widthThin: string;      // 1px
      widthMax: string;       // 1px
      radiusSm: string;       // 0.25rem (4px)
      radiusMd: string;       // 0.375rem (6px)
      radiusLg: string;       // 0.5rem (8px)
      radiusXl: string;       // 0.75rem (12px)
      radiusFull: string;     // 9999px
    };
    shadow: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    focus: {
      ringWidth: string;      // 3px
      ringColor: string;      // rgba(125, 87, 193, 0.3)
      ringOffset: string;     // 2px
    };
  };
  layout: {
    contentMaxWidth: {
      sm: string;             // 75rem (1200px)
      lg: string;             // 80rem (1280px)
    };
    contentPadding: string;   // var(--spacing-6) (24px)
    contentPaddingMobile: string; // var(--spacing-4) (16px)
  };
  transitions: {
    fast: string;             // 150ms cubic-bezier(0.4, 0, 0.2, 1)
    base: string;             // 200ms cubic-bezier(0.4, 0, 0.2, 1)
    slow: string;             // 300ms cubic-bezier(0.4, 0, 0.2, 1)
  };
  zIndex: {
    dropdown: number;         // 1000
    sticky: number;           // 1020
    fixed: number;            // 1030
    modalBackdrop: number;    // 1040
    modal: number;            // 1050
    popover: number;          // 1060
    tooltip: number;          // 1070
  };
}

/**
 * Design token values matching CSS custom properties
 */
export const designTokens: DesignTokens = {
  colors: {
    background: {
      app: '#0F0F10',
      surface: '#151516',
      hover: '#1A1A1C',
      input: '#18181A',
    },
    border: {
      subtle: '#2E2E33',
      emphasis: '#3E3E43',
      focus: '#7D57C1',
    },
    accent: {
      primary: '#7D57C1',
      hover: '#6B47AF',
      active: '#5A3A9D',
    },
    text: {
      primary: '#EDEDEF',
      secondary: '#8A8F98',
      muted: '#6B7280',
      inverse: '#0F0F10',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  typography: {
    fontFamily: {
      base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
    },
    weights: {
      regular: 400,
      medium: 500,
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    unit: 4,
    scale: [0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96],
  },
  components: {
    input: {
      heightDense: '2rem',
      heightStandard: '2.5rem',
      paddingX: 'var(--spacing-3)',
      paddingY: 'var(--spacing-2)',
      borderWidth: '1px',
      borderRadius: '0.375rem',
    },
    button: {
      heightDense: '2rem',
      heightStandard: '2.5rem',
      paddingX: 'var(--spacing-4)',
      paddingY: 'var(--spacing-2)',
      borderRadius: '0.375rem',
    },
    border: {
      widthThin: '1px',
      widthMax: '1px',
      radiusSm: '0.25rem',
      radiusMd: '0.375rem',
      radiusLg: '0.5rem',
      radiusXl: '0.75rem',
      radiusFull: '9999px',
    },
    shadow: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
    },
    focus: {
      ringWidth: '3px',
      ringColor: 'rgba(125, 87, 193, 0.3)',
      ringOffset: '2px',
    },
  },
  layout: {
    contentMaxWidth: {
      sm: '75rem',
      lg: '80rem',
    },
    contentPadding: 'var(--spacing-6)',
    contentPaddingMobile: 'var(--spacing-4)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};
