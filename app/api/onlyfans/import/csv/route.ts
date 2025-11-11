import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { FansRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { z } from 'zod';

// CSV row validation schema
const CSVRowSchema = z.object({
  'Username': z.string().optional(),
  'Display Name': z.string().optional(),
  'Email': z.string().email().optional().or(z.literal('')),
  'Subscription Tier': z.string().optional(),
  'Total Spent': z.string().optional(),
  'Last Seen': z.string().optional(),
});

interface ImportSummary {
  totalRows: number;
  successfulInserts: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

async function postHandler(request: NextRequest) {
  try {
    // Rate limit CSV imports (expensive operation)
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ id: ident.id, limit: 10, windowSec: 3600 }); // 10 per hour
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Invalid file type (must be CSV)' }, { status: 400 });
    }

    // Read and parse CSV
    const csvContent = await file.text();
    
    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid CSV format', details: (error as Error).message },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Validate required columns
    const firstRow = records[0];
    const hasUsername = 'Username' in firstRow;
    const hasDisplayName = 'Display Name' in firstRow;

    if (!hasUsername && !hasDisplayName) {
      return NextResponse.json(
        { error: 'CSV must contain at least "Username" or "Display Name" column' },
        { status: 400 }
      );
    }

    // Process records
    const summary: ImportSummary = {
      totalRows: records.length,
      successfulInserts: 0,
      skipped: 0,
      errors: [],
    };

    for (const [index, record] of records.entries()) {
      try {
        // Validate row
        const validated = CSVRowSchema.parse(record);

        // Skip if no name
        const name = validated['Display Name'] || validated['Username'];
        if (!name || name.trim() === '') {
          summary.skipped++;
          continue;
        }

        // Parse value cents from "Total Spent" (e.g., "$500.00" -> 50000)
        let valueCents = 0;
        if (validated['Total Spent']) {
          const cleanedValue = validated['Total Spent'].replace(/[$,]/g, '');
          const parsedValue = parseFloat(cleanedValue);
          if (!isNaN(parsedValue)) {
            valueCents = Math.round(parsedValue * 100);
          }
        }

        // Parse last seen date
        let lastSeenAt: Date | undefined;
        if (validated['Last Seen']) {
          const parsedDate = new Date(validated['Last Seen']);
          if (!isNaN(parsedDate.getTime())) {
            lastSeenAt = parsedDate;
          }
        }

        // Create fan data
        const fanData: any = {
          name: name.trim(),
          platform: 'onlyfans',
          handle: validated['Username'] ? `@${validated['Username']}` : undefined,
          email: validated['Email'] || undefined,
          tags: validated['Subscription Tier'] ? [validated['Subscription Tier']] : [],
          valueCents,
          lastSeenAt: lastSeenAt?.toISOString(),
        };

        // Insert into database
        await FansRepository.createFan(userId, fanData);
        summary.successfulInserts++;
      } catch (error) {
        summary.errors.push({
          row: index + 2, // +2 because: +1 for 1-based indexing, +1 for header row
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Failed to import CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export const POST = postHandler as any;
