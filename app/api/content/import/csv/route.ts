import { NextRequest, NextResponse } from 'next/server';
import { 
  parseCsv, 
  validateCsvData, 
  transformCsvRowToContent,
  CsvMapping 
} from '@/lib/services/csvImporter';
import { createContentItem } from '@/lib/db/repositories/contentItemsRepository';
import { verifyAuth } from '@/lib/auth/jwt';

/**
 * POST /api/content/import/csv
 * Import content from CSV file
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.payload.userId;
    const body = await request.json();
    const { csvContent, mapping } = body;

    // Validate input
    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      );
    }

    if (!mapping || !mapping.title || !mapping.content) {
      return NextResponse.json(
        { error: 'Column mapping is required (title and content fields)' },
        { status: 400 }
      );
    }

    // Parse CSV
    let rows;
    try {
      rows = parseCsv(csvContent);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to parse CSV',
          details: error instanceof Error ? error.message : 'Invalid CSV format'
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file contains no data rows' },
        { status: 400 }
      );
    }

    // Limit to 50 rows per import
    if (rows.length > 50) {
      return NextResponse.json(
        { error: 'CSV import limited to 50 rows per batch. Please split your file.' },
        { status: 400 }
      );
    }

    // Validate data
    const validation = validateCsvData(rows, mapping as CsvMapping);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          totalRows: validation.totalRows,
          validRows: validation.validRows,
          invalidRows: validation.invalidRows,
          errors: validation.errors,
          message: 'Validation failed. Please fix the errors and try again.',
        },
        { status: 422 }
      );
    }

    // Import valid rows
    const importedItems = [];
    const importErrors = [];

    for (let i = 0; i < validation.data.length; i++) {
      const row = validation.data[i];
      
      try {
        const contentData = transformCsvRowToContent(row, mapping as CsvMapping);
        
        const contentItem = await createContentItem({
          user_id: userId,
          ...contentData,
          metadata: {
            source: 'csv_import',
            importedAt: new Date().toISOString(),
          },
        });

        importedItems.push(contentItem);
      } catch (error) {
        importErrors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: validation.totalRows,
      importedCount: importedItems.length,
      failedCount: importErrors.length,
      importedItems,
      errors: importErrors,
      message: `Successfully imported ${importedItems.length} of ${validation.totalRows} content items.`,
    });

  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import CSV',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/import/csv/template
 * Download CSV template
 */
export async function GET() {
  const { generateCsvTemplate } = await import('@/lib/services/csvImporter');
  const template = generateCsvTemplate();

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="content-import-template.csv"',
    },
  });
}
