/**
 * TypeScript type definitions for Changelog API
 * 
 * These types are used by both the API route and client components
 * to ensure type safety across the application.
 */

/**
 * Represents a single changelog entry
 */
export interface ChangelogEntry {
  /** Unique identifier for the changelog entry */
  id: string;
  
  /** Title of the release or update */
  title: string;
  
  /** Brief description of the changes */
  description: string;
  
  /** ISO 8601 formatted release date (e.g., "2024-01-15T00:00:00Z") */
  releaseDate: string;
  
  /** Array of feature descriptions included in this release */
  features: string[];
}

/**
 * Response format for the Changelog API
 */
export interface ChangelogResponse {
  /** Array of changelog entries, sorted by date (newest first) */
  entries: ChangelogEntry[];
  
  /** ISO 8601 date of the most recent release */
  latestReleaseDate: string;
}

/**
 * Error response format (when API fails)
 */
export interface ChangelogErrorResponse {
  /** Empty array when error occurs */
  entries: [];
  
  /** Unix epoch date when error occurs */
  latestReleaseDate: string;
}

/**
 * Type guard to check if response is an error
 */
export function isChangelogError(
  response: ChangelogResponse | ChangelogErrorResponse
): response is ChangelogErrorResponse {
  return response.entries.length === 0 && 
         response.latestReleaseDate === new Date(0).toISOString();
}

/**
 * Helper to parse and validate changelog entry dates
 */
export function parseChangelogDate(dateString: string): Date {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid changelog date: ${dateString}`);
  }
  
  return date;
}

/**
 * Helper to format changelog date for display
 */
export function formatChangelogDate(dateString: string): string {
  try {
    const date = parseChangelogDate(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Helper to check if a changelog entry is new (released after a given date)
 */
export function isNewChangelogEntry(
  entry: ChangelogEntry,
  lastViewedDate: Date
): boolean {
  try {
    const releaseDate = parseChangelogDate(entry.releaseDate);
    return releaseDate > lastViewedDate;
  } catch {
    return false;
  }
}

/**
 * Helper to sort changelog entries by date (newest first)
 */
export function sortChangelogEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].sort((a, b) => {
    try {
      const dateA = parseChangelogDate(a.releaseDate);
      const dateB = parseChangelogDate(b.releaseDate);
      return dateB.getTime() - dateA.getTime(); // Descending order
    } catch {
      return 0;
    }
  });
}
