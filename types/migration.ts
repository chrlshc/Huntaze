/**
 * Migration Tracking Types
 * 
 * Types for tracking the progressive migration from legacy styles
 * to the new Linear UI design system.
 * 
 * Part of: linear-ui-performance-refactor
 * Requirements: 11.1, 11.2
 */

/**
 * Migration status for a component or page
 */
export type MigrationStatus = 'legacy' | 'in-progress' | 'migrated';

/**
 * Priority level for migration
 */
export type MigrationPriority = 'high' | 'medium' | 'low';

/**
 * Category of the component being migrated
 */
export type MigrationCategory = 
  | 'page'           // Full page components
  | 'layout'         // Layout components
  | 'form'           // Form components
  | 'ui'             // UI components
  | 'marketing'      // Marketing pages
  | 'dashboard';     // Dashboard components

/**
 * Design system features applied to a component
 */
export interface DesignSystemFeatures {
  /** Uses design tokens from linear-design-tokens.css */
  usesDesignTokens: boolean;
  
  /** Wrapped in CenteredContainer */
  usesCenteredContainer: boolean;
  
  /** Implements skeleton loading states */
  usesSkeletonScreens: boolean;
  
  /** Uses lazy loading for heavy components */
  usesLazyLoading: boolean;
  
  /** Follows 4px spacing grid */
  uses4pxGrid: boolean;
  
  /** Uses Midnight Violet color palette */
  usesMidnightViolet: boolean;
  
  /** Uses Inter typography */
  usesInterFont: boolean;
}

/**
 * Tracking entry for a single component or page
 */
export interface MigrationEntry {
  /** Unique identifier (usually the file path) */
  id: string;
  
  /** Display name of the component/page */
  name: string;
  
  /** File path relative to project root */
  path: string;
  
  /** Current migration status */
  status: MigrationStatus;
  
  /** Category of the component */
  category: MigrationCategory;
  
  /** Priority for migration */
  priority: MigrationPriority;
  
  /** Design system features applied */
  features: DesignSystemFeatures;
  
  /** Date when migration started (ISO 8601) */
  startedDate?: string;
  
  /** Date when migration completed (ISO 8601) */
  completedDate?: string;
  
  /** Notes about the migration */
  notes?: string;
  
  /** Related requirements from requirements.md */
  requirements?: string[];
  
  /** Related tasks from tasks.md */
  tasks?: string[];
}

/**
 * Complete migration tracking data structure
 */
export interface MigrationTracker {
  /** Version of the tracking schema */
  version: string;
  
  /** Last updated timestamp (ISO 8601) */
  lastUpdated: string;
  
  /** Overall migration statistics */
  stats: {
    total: number;
    legacy: number;
    inProgress: number;
    migrated: number;
    percentComplete: number;
  };
  
  /** All migration entries */
  entries: MigrationEntry[];
}

/**
 * Filter options for querying migration entries
 */
export interface MigrationFilter {
  status?: MigrationStatus | MigrationStatus[];
  category?: MigrationCategory | MigrationCategory[];
  priority?: MigrationPriority | MigrationPriority[];
}
