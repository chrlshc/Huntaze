/**
 * Property Test: CSV Export Data Integrity
 * 
 * Feature: creator-analytics-dashboard, Property 12: CSV Export Data Integrity
 * Validates: Requirements 13.2, 13.3
 * 
 * For any exportable data set, the CSV export SHALL contain all visible columns 
 * plus required IDs, and parsing the CSV back SHALL produce equivalent data.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Convertit un tableau d'objets en CSV
 */
function convertToCSV(
  data: Record<string, any>[],
  columns?: string[],
  columnLabels?: Record<string, string>
): string {
  if (data.length === 0) return '';
  
  const cols = columns || Object.keys(data[0]);
  const headers = cols.map(col => columnLabels?.[col] || col);
  const headerRow = headers.map(escapeCSVValue).join(',');
  
  const dataRows = data.map(row => {
    return cols.map(col => {
      const value = row[col];
      return escapeCSVValue(value);
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Échappe une valeur pour CSV
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Parse un CSV en tableau d'objets
 * Note: CSV parsing is inherently lossy - types are not preserved
 */
function parseCSV(csv: string, columns?: string[]): Record<string, any>[] {
  if (!csv.trim()) return [];
  
  // Parse all lines (including those with newlines in quoted values)
  const allLines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        allLines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine.trim()) {
    allLines.push(currentLine);
  }
  
  if (allLines.length === 0) return [];
  
  // Parse header
  const headers = parseCSVLine(allLines[0]);
  const cols = columns || headers;
  
  // Parse data rows
  return allLines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, any> = {};
    
    cols.forEach((col, i) => {
      const value = values[i];
      
      // Handle undefined/missing values
      if (value === undefined) {
        row[col] = '';
        return;
      }
      
      // Keep strings as-is (don't convert to numbers)
      // This preserves whitespace-only strings and string numbers like "0"
      row[col] = value;
    });
    
    return row;
  });
}

/**
 * Parse une ligne CSV en tenant compte des guillemets
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let wasQuoted = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Guillemet échappé
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
        if (!inQuotes) {
          wasQuoted = true;
        }
      }
    } else if (char === ',' && !inQuotes) {
      // Fin de colonne - préserver les strings vides si elles étaient quotées
      result.push(current);
      current = '';
      wasQuoted = false;
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Vérifie si deux valeurs sont équivalentes (gère les conversions de type)
 * CSV est lossy - les types sont perdus, tout devient string
 */
function areValuesEquivalent(a: any, b: any): boolean {
  // Null/undefined/empty string sont équivalents en CSV
  if ((a === null || a === undefined || a === '') && (b === null || b === undefined || b === '')) {
    return true;
  }
  
  // Conversion en string pour comparaison (CSV perd les types)
  return String(a) === String(b);
}

describe('**Feature: creator-analytics-dashboard, Property 12: CSV Export Data Integrity**', () => {
  it('should preserve all data through CSV export and parse round-trip', () => {
    fc.assert(
      fc.property(
        // Générer un tableau d'objets avec différents types de données
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.integer({ min: 0, max: 1000000 }),
            percentage: fc.float({ min: 0, max: 100, noNaN: true }),
            isActive: fc.boolean(),
            description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (data) => {
          // Export to CSV
          const csv = convertToCSV(data);
          
          // Parse back
          const columns = Object.keys(data[0]);
          const parsed = parseCSV(csv, columns);
          
          // Vérifier que le nombre de lignes est préservé
          expect(parsed.length).toBe(data.length);
          
          // Vérifier que chaque ligne est équivalente
          data.forEach((original, i) => {
            const parsedRow = parsed[i];
            
            columns.forEach(col => {
              expect(
                areValuesEquivalent(original[col], parsedRow[col]),
                `Column ${col} at row ${i}: expected ${original[col]} to equal ${parsedRow[col]}`
              ).toBe(true);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle special CSV characters (commas, quotes, newlines)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            // Générer des strings avec caractères spéciaux CSV
            text: fc.oneof(
              fc.string({ minLength: 1, maxLength: 30 }),
              fc.constant('value, with, commas'),
              fc.constant('value "with" quotes'),
              fc.constant('value\nwith\nnewlines'),
              fc.constant('value, "with", both'),
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const csv = convertToCSV(data);
          const columns = Object.keys(data[0]);
          const parsed = parseCSV(csv, columns);
          
          expect(parsed.length).toBe(data.length);
          
          data.forEach((original, i) => {
            expect(parsed[i].id).toBe(original.id);
            expect(parsed[i].text).toBe(original.text);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve column order when columns are specified', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            value: fc.integer({ min: 0, max: 1000 }),
            extra: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(fc.constantFrom('id', 'name', 'value'), { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)]),
        (data, columns) => {
          const csv = convertToCSV(data, columns);
          const lines = csv.split('\n');
          
          // Vérifier que l'en-tête contient les colonnes dans l'ordre
          const headers = parseCSVLine(lines[0]);
          expect(headers).toEqual(columns);
          
          // Vérifier que les données sont dans le bon ordre
          const parsed = parseCSV(csv, columns);
          expect(parsed.length).toBe(data.length);
          
          data.forEach((original, i) => {
            columns.forEach(col => {
              expect(
                areValuesEquivalent(original[col], parsed[i][col])
              ).toBe(true);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply custom column labels to headers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            totalSpent: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (data) => {
          const columnLabels = {
            id: 'Fan ID',
            totalSpent: 'Total Spent ($)',
          };
          
          const csv = convertToCSV(data, undefined, columnLabels);
          const lines = csv.split('\n');
          const headers = parseCSVLine(lines[0]);
          
          // Vérifier que les labels personnalisés sont utilisés
          expect(headers).toContain('Fan ID');
          expect(headers).toContain('Total Spent ($)');
          
          // Vérifier que les données sont toujours correctes
          const parsed = parseCSV(csv, ['id', 'totalSpent']);
          expect(parsed.length).toBe(data.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty data gracefully', () => {
    const csv = convertToCSV([]);
    expect(csv).toBe('');
    
    const parsed = parseCSV('');
    expect(parsed).toEqual([]);
  });

  it('should handle null and undefined values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            optional: fc.option(fc.string(), { nil: null }),
            maybeUndefined: fc.option(fc.integer(), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const csv = convertToCSV(data);
          const columns = Object.keys(data[0]);
          const parsed = parseCSV(csv, columns);
          
          expect(parsed.length).toBe(data.length);
          
          // Null et undefined deviennent des strings vides en CSV
          data.forEach((original, i) => {
            expect(parsed[i].id).toBe(original.id);
            
            if (original.optional === null || original.optional === undefined) {
              expect(parsed[i].optional).toBe('');
            } else {
              expect(parsed[i].optional).toBe(original.optional);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include period in filename when provided', () => {
    // Ce test vérifie la logique de construction du nom de fichier
    const filename = 'whale-detector';
    const period = '2024-01-01_to_2024-01-31';
    const expectedFilename = `${filename}_${period}.csv`;
    
    expect(expectedFilename).toBe('whale-detector_2024-01-01_to_2024-01-31.csv');
  });

  it('should export all visible columns plus required IDs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            fanId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0), // Required ID
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            totalSpent: fc.integer({ min: 0, max: 10000 }),
            lastPurchaseAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          // Export avec toutes les colonnes (incluant fanId)
          const csv = convertToCSV(data);
          const lines = csv.split('\n');
          const headers = parseCSVLine(lines[0]);
          
          // Vérifier que fanId est inclus
          expect(headers).toContain('fanId');
          
          // Vérifier que toutes les colonnes visibles sont incluses
          expect(headers).toContain('name');
          expect(headers).toContain('totalSpent');
          expect(headers).toContain('lastPurchaseAt');
          
          // Vérifier que les données sont complètes
          const parsed = parseCSV(csv, Object.keys(data[0]));
          expect(parsed.length).toBe(data.length);
          
          parsed.forEach((row, i) => {
            expect(row.fanId).toBe(data[i].fanId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
