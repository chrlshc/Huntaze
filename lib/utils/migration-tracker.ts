/**
 * Migration Tracker Utility
 * 
 * Utilities for managing and querying the Linear UI migration tracking system.
 * Provides functions to read, update, and analyze migration progress.
 * 
 * Part of: linear-ui-performance-refactor
 * Requirements: 11.1, 11.2
 */

import fs from 'fs';
import path from 'path';
import type {
  MigrationTracker,
  MigrationEntry,
  MigrationStatus,
  MigrationFilter,
  MigrationPriority,
  MigrationCategory,
} from '@/types/migration';

const TRACKER_PATH = path.join(
  process.cwd(),
  '.kiro/specs/linear-ui-performance-refactor/migration-tracker.json'
);

/**
 * Load the migration tracker data from disk
 */
export function loadMigrationTracker(): MigrationTracker {
  try {
    const data = fs.readFileSync(TRACKER_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load migration tracker: ${error}`);
  }
}

/**
 * Save the migration tracker data to disk
 */
export function saveMigrationTracker(tracker: MigrationTracker): void {
  try {
    // Update lastUpdated timestamp
    tracker.lastUpdated = new Date().toISOString();
    
    // Recalculate stats
    tracker.stats = calculateStats(tracker.entries);
    
    // Write to disk with pretty formatting
    fs.writeFileSync(
      TRACKER_PATH,
      JSON.stringify(tracker, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(`Failed to save migration tracker: ${error}`);
  }
}

/**
 * Calculate migration statistics from entries
 */
function calculateStats(entries: MigrationEntry[]) {
  const total = entries.length;
  const legacy = entries.filter(e => e.status === 'legacy').length;
  const inProgress = entries.filter(e => e.status === 'in-progress').length;
  const migrated = entries.filter(e => e.status === 'migrated').length;
  const percentComplete = total > 0 ? Math.round((migrated / total) * 100 * 100) / 100 : 0;
  
  return {
    total,
    legacy,
    inProgress,
    migrated,
    percentComplete,
  };
}

/**
 * Get a specific migration entry by ID
 */
export function getMigrationEntry(id: string): MigrationEntry | undefined {
  const tracker = loadMigrationTracker();
  return tracker.entries.find(entry => entry.id === id);
}

/**
 * Filter migration entries based on criteria
 */
export function filterMigrationEntries(filter: MigrationFilter): MigrationEntry[] {
  const tracker = loadMigrationTracker();
  
  return tracker.entries.filter(entry => {
    // Filter by status
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      if (!statuses.includes(entry.status)) {
        return false;
      }
    }
    
    // Filter by category
    if (filter.category) {
      const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
      if (!categories.includes(entry.category)) {
        return false;
      }
    }
    
    // Filter by priority
    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (!priorities.includes(entry.priority)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Update the status of a migration entry
 */
export function updateMigrationStatus(
  id: string,
  status: MigrationStatus,
  notes?: string
): void {
  const tracker = loadMigrationTracker();
  const entry = tracker.entries.find(e => e.id === id);
  
  if (!entry) {
    throw new Error(`Migration entry not found: ${id}`);
  }
  
  // Update status
  entry.status = status;
  
  // Update timestamps
  if (status === 'in-progress' && !entry.startedDate) {
    entry.startedDate = new Date().toISOString();
  }
  
  if (status === 'migrated') {
    entry.completedDate = new Date().toISOString();
  }
  
  // Update notes if provided
  if (notes) {
    entry.notes = notes;
  }
  
  saveMigrationTracker(tracker);
}

/**
 * Add a new migration entry
 */
export function addMigrationEntry(entry: Omit<MigrationEntry, 'id'>): void {
  const tracker = loadMigrationTracker();
  
  // Generate ID from path
  const id = entry.path
    .replace(/^(app|components|styles)\//, '')
    .replace(/\.(tsx?|css)$/, '')
    .replace(/\//g, '-');
  
  // Check if entry already exists
  if (tracker.entries.some(e => e.id === id)) {
    throw new Error(`Migration entry already exists: ${id}`);
  }
  
  tracker.entries.push({
    ...entry,
    id,
  });
  
  saveMigrationTracker(tracker);
}

/**
 * Get migration progress summary
 */
export function getMigrationSummary() {
  const tracker = loadMigrationTracker();
  
  return {
    ...tracker.stats,
    byCategory: getCategoryBreakdown(tracker.entries),
    byPriority: getPriorityBreakdown(tracker.entries),
    highPriorityRemaining: tracker.entries.filter(
      e => e.priority === 'high' && e.status !== 'migrated'
    ).length,
  };
}

/**
 * Get breakdown by category
 */
function getCategoryBreakdown(entries: MigrationEntry[]) {
  const categories: Record<MigrationCategory, { total: number; migrated: number }> = {
    page: { total: 0, migrated: 0 },
    layout: { total: 0, migrated: 0 },
    form: { total: 0, migrated: 0 },
    ui: { total: 0, migrated: 0 },
    marketing: { total: 0, migrated: 0 },
    dashboard: { total: 0, migrated: 0 },
  };
  
  entries.forEach(entry => {
    categories[entry.category].total++;
    if (entry.status === 'migrated') {
      categories[entry.category].migrated++;
    }
  });
  
  return categories;
}

/**
 * Get breakdown by priority
 */
function getPriorityBreakdown(entries: MigrationEntry[]) {
  const priorities: Record<MigrationPriority, { total: number; migrated: number }> = {
    high: { total: 0, migrated: 0 },
    medium: { total: 0, migrated: 0 },
    low: { total: 0, migrated: 0 },
  };
  
  entries.forEach(entry => {
    priorities[entry.priority].total++;
    if (entry.status === 'migrated') {
      priorities[entry.priority].migrated++;
    }
  });
  
  return priorities;
}

/**
 * Get next components to migrate based on priority
 */
export function getNextToMigrate(limit: number = 5): MigrationEntry[] {
  const tracker = loadMigrationTracker();
  
  // Sort by priority (high > medium > low) and then by category
  const priorityOrder: Record<MigrationPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  
  return tracker.entries
    .filter(e => e.status === 'legacy')
    .sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by name
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

/**
 * Check if a component uses the new design system
 */
export function isUsingDesignSystem(id: string): boolean {
  const entry = getMigrationEntry(id);
  if (!entry) return false;
  
  return entry.status === 'migrated' && entry.features.usesDesignTokens;
}

/**
 * Generate a migration report as markdown
 */
export function generateMigrationReport(): string {
  const tracker = loadMigrationTracker();
  const summary = getMigrationSummary();
  
  let report = '# Linear UI Migration Progress Report\n\n';
  report += `**Last Updated:** ${new Date(tracker.lastUpdated).toLocaleString()}\n\n`;
  
  // Overall progress
  report += '## Overall Progress\n\n';
  report += `- **Total Components:** ${summary.total}\n`;
  report += `- **Migrated:** ${summary.migrated} (${summary.percentComplete}%)\n`;
  report += `- **In Progress:** ${summary.inProgress}\n`;
  report += `- **Legacy:** ${summary.legacy}\n`;
  report += `- **High Priority Remaining:** ${summary.highPriorityRemaining}\n\n`;
  
  // Progress bar
  const progressBar = '█'.repeat(Math.floor(summary.percentComplete / 5)) + 
                      '░'.repeat(20 - Math.floor(summary.percentComplete / 5));
  report += `\`\`\`\n${progressBar} ${summary.percentComplete}%\n\`\`\`\n\n`;
  
  // By category
  report += '## Progress by Category\n\n';
  Object.entries(summary.byCategory).forEach(([category, stats]) => {
    const percent = stats.total > 0 ? Math.round((stats.migrated / stats.total) * 100) : 0;
    report += `- **${category}:** ${stats.migrated}/${stats.total} (${percent}%)\n`;
  });
  report += '\n';
  
  // By priority
  report += '## Progress by Priority\n\n';
  Object.entries(summary.byPriority).forEach(([priority, stats]) => {
    const percent = stats.total > 0 ? Math.round((stats.migrated / stats.total) * 100) : 0;
    report += `- **${priority}:** ${stats.migrated}/${stats.total} (${percent}%)\n`;
  });
  report += '\n';
  
  // Next to migrate
  const nextItems = getNextToMigrate(5);
  if (nextItems.length > 0) {
    report += '## Next to Migrate (Top 5)\n\n';
    nextItems.forEach((item, index) => {
      report += `${index + 1}. **${item.name}** (${item.priority} priority)\n`;
      report += `   - Path: \`${item.path}\`\n`;
      report += `   - Category: ${item.category}\n`;
      if (item.notes) {
        report += `   - Notes: ${item.notes}\n`;
      }
      report += '\n';
    });
  }
  
  // Migrated components
  const migrated = tracker.entries.filter(e => e.status === 'migrated');
  if (migrated.length > 0) {
    report += '## Completed Migrations\n\n';
    migrated.forEach(item => {
      report += `- ✅ **${item.name}**\n`;
      report += `  - Path: \`${item.path}\`\n`;
      if (item.completedDate) {
        report += `  - Completed: ${new Date(item.completedDate).toLocaleDateString()}\n`;
      }
      if (item.notes) {
        report += `  - Notes: ${item.notes}\n`;
      }
    });
  }
  
  return report;
}
