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
 */
export const Container: React.FC<ContainerProps> = ({
  maxWidth = 'lg',
  padding = 'md',
  centered = true,
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
  
  const style: React.CSSProperties = {
    ...maxWidthStyles[maxWidth],
    ...paddingStyles[padding],
    ...(centered && { marginLeft: 'auto', marginRight: 'auto' }),
    width: '100%',
  };
  
  return (
    <Component 
      className={className}
      style={style}
      data-testid="container"
      data-max-width={maxWidth}
      data-padding={padding}
    >
      {children}
    </Component>
  );
};

export default Container;
