/**
 * CSV Importer Service
 * Handles bulk import of content from CSV files
 */

export interface CsvRow {
  [key: string]: string;
}

export interface CsvMapping {
  title: string;
  content: string;
  platforms?: string;
  tags?: string;
  category?: string;
  scheduledAt?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CsvImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  data: CsvRow[];
}

/**
 * Parse CSV content
 */
export function parseCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const headers = parseCsvLine(lines[0]);
  
  // Parse rows
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    
    if (values.length === 0) continue; // Skip empty lines
    
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current.trim());

  return values;
}

/**
 * Validate CSV data with mapping
 */
export function validateCsvData(
  rows: CsvRow[],
  mapping: CsvMapping
): CsvImportResult {
  const errors: ValidationError[] = [];
  const validData: CsvRow[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
    let isValid = true;

    // Validate required fields
    if (!row[mapping.title] || row[mapping.title].trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: mapping.title,
        message: 'Title is required',
      });
      isValid = false;
    } else if (row[mapping.title].length < 3) {
      errors.push({
        row: rowNumber,
        field: mapping.title,
        message: 'Title must be at least 3 characters',
      });
      isValid = false;
    }

    if (!row[mapping.content] || row[mapping.content].trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: mapping.content,
        message: 'Content is required',
      });
      isValid = false;
    } else if (row[mapping.content].length < 10) {
      errors.push({
        row: rowNumber,
        field: mapping.content,
        message: 'Content must be at least 10 characters',
      });
      isValid = false;
    }

    // Validate platforms if provided
    if (mapping.platforms && row[mapping.platforms]) {
      const platforms = row[mapping.platforms].split(',').map(p => p.trim().toLowerCase());
      const validPlatforms = ['instagram', 'tiktok', 'twitter', 'facebook', 'linkedin', 'youtube'];
      
      const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        errors.push({
          row: rowNumber,
          field: mapping.platforms,
          message: `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid: ${validPlatforms.join(', ')}`,
        });
        isValid = false;
      }
    }

    // Validate scheduled date if provided
    if (mapping.scheduledAt && row[mapping.scheduledAt]) {
      const date = new Date(row[mapping.scheduledAt]);
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowNumber,
          field: mapping.scheduledAt,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)',
        });
        isValid = false;
      } else if (date < new Date()) {
        errors.push({
          row: rowNumber,
          field: mapping.scheduledAt,
          message: 'Scheduled date must be in the future',
        });
        isValid = false;
      }
    }

    if (isValid) {
      validData.push(row);
    }
  });

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    validRows: validData.length,
    invalidRows: errors.length,
    errors,
    data: validData,
  };
}

/**
 * Transform CSV row to content item data
 */
export function transformCsvRowToContent(row: CsvRow, mapping: CsvMapping) {
  const contentData: any = {
    title: row[mapping.title],
    content: row[mapping.content],
    status: 'draft',
  };

  // Add platforms if provided
  if (mapping.platforms && row[mapping.platforms]) {
    contentData.platforms = row[mapping.platforms]
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => p);
  }

  // Add tags if provided
  if (mapping.tags && row[mapping.tags]) {
    contentData.tags = row[mapping.tags]
      .split(',')
      .map(t => t.trim())
      .filter(t => t);
  }

  // Add category if provided
  if (mapping.category && row[mapping.category]) {
    contentData.category = row[mapping.category].trim();
  }

  // Add scheduled date if provided
  if (mapping.scheduledAt && row[mapping.scheduledAt]) {
    const date = new Date(row[mapping.scheduledAt]);
    if (!isNaN(date.getTime())) {
      contentData.scheduled_at = date.toISOString();
      contentData.status = 'scheduled';
    }
  }

  return contentData;
}

/**
 * Get available columns from CSV
 */
export function getAvailableColumns(csvContent: string): string[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  return parseCsvLine(lines[0]);
}

/**
 * Generate sample CSV template
 */
export function generateCsvTemplate(): string {
  const headers = ['title', 'content', 'platforms', 'tags', 'category', 'scheduledAt'];
  const sampleRow = [
    'My First Post',
    'This is the content of my post. It can be quite long and detailed.',
    'instagram,twitter',
    'marketing,social-media',
    'promotional',
    '2024-12-01T10:00:00Z',
  ];

  return [
    headers.join(','),
    sampleRow.map(v => `"${v}"`).join(','),
  ].join('\n');
}
