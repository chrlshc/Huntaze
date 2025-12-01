/**
 * Container Component
 * 
 * A flexible layout container component that provides max-width constraints,
 * responsive behavior, and consistent spacing using design tokens.
 * 
 * Part of the Design System Unification
 * Validates: Requirements 5.1, 5.2, 7.1, 7.2
 */

import React from 'react';

export interface ContainerProps {
  /**
   * Maximum width variant
   * - 'sm': 640px
   * - 'md': 768px
   * - 'lg': 1024px
   * - 'xl': 1280px
   * - 'full': 100%
   * @default 'lg'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /**
   * Padding variant using spacing tokens
   * - 'none': no padding
   * - 'sm': var(--space-4) - 16px
   * - 'md': var(--space-6) - 24px
   * - 'lg': var(--space-8) - 32px
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Whether to center the container horizontally
   * @default true
   */
  centered?: boolean;
  
  /**
   * Nesting level for progressive background lightening
   * - 0: Page level (--bg-primary)
   * - 1: Main cards (--bg-card-elevated)
   * - 2: Nested cards (--bg-secondary)
   * - 3: Inner elements (--bg-glass-hover)
   * @default undefined (no nesting background applied)
   */
  nestingLevel?: 0 | 1 | 2 | 3;
  
  /**
   * Content to be rendered inside the container
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * HTML element to render as
   * @default 'div'
   */
  as?: 'div' | 'section' | 'article' | 'main' | 'aside';
}

/**
 * Container provides a max-width constrained, optionally centered
 * container for content with responsive behavior using design tokens.
 * 
 * @example
 * ```tsx
 * <Container maxWidth="lg" padding="md">
 *   <h1>Dashboard</h1>
 *   <div>Content goes here</div>
 * </Container>
 * ```
 * 
 * @example
 * ```tsx
 * <Container maxWidth="sm" padding="lg" as="section">
 *   <form>Form content</form>
 * </Container>
 * ```
 * 
 * @example
 * ```tsx
 * <Container maxWidth="full" padding="none">
 *   <div>Full-width content</div>
 * </Container>
 * ```
 * 
 * @example Progressive nesting with background hierarchy
 * ```tsx
 * <Container nestingLevel={0}>
 *   <h1>Page Title</h1>
 *   <Container nestingLevel={1}>
 *     <h2>Section Title</h2>
 *     <Container nestingLevel={2}>
 *       <p>Nested content</p>
 *     </Container>
 *   </Container>
 * </Container>
 * ```
 */
export const Container: React.FC<ContainerProps> = ({
  maxWidth = 'lg',
  padding = 'md',
  centered = true,
  nestingLevel,
  children,
  className = '',
  as: Component = 'div',
}) => {
  // Map maxWidth to design token CSS variables
  const maxWidthStyles: Record<string, React.CSSProperties> = {
    sm: { maxWidth: 'var(--content-max-width-sm)' },
    md: { maxWidth: 'var(--content-max-width-md)' },
    lg: { maxWidth: 'var(--content-max-width-lg)' },
    xl: { maxWidth: 'var(--content-max-width-xl)' },
    full: { maxWidth: '100%' },
  };
  
  // Map padding to design token CSS variables
  const paddingStyles: Record<string, React.CSSProperties> = {
    none: { padding: '0' },
    sm: { padding: 'var(--space-4)' },
    md: { padding: 'var(--space-6)' },
    lg: { padding: 'var(--space-8)' },
  };
  
  // Build nesting class if specified
  const nestingClass = nestingLevel !== undefined ? `nesting-level-${nestingLevel}` : '';
  
  const style: React.CSSProperties = {
    ...maxWidthStyles[maxWidth],
    ...paddingStyles[padding],
    ...(centered && { marginLeft: 'auto', marginRight: 'auto' }),
    width: '100%',
  };
  
  return (
    <Component 
      className={`${nestingClass} ${className}`.trim()}
      style={style}
      data-testid="container"
      data-max-width={maxWidth}
      data-padding={padding}
      data-nesting-level={nestingLevel}
    >
      {children}
    </Component>
  );
};

export default Container;
