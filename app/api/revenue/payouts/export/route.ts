import { NextRequest } from 'next/server';
import { getSession, validateOwnership } from '@/lib/auth/session';

/**
 * GET /api/revenue/payouts/export
 * 
 * Export payout data as CSV or PDF
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const format = searchParams.get('format') || 'csv';

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (!['csv', 'pdf'].includes(format)) {
      return Response.json(
        { error: 'format must be "csv" or "pdf"' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (!validateOwnership(session, creatorId)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[API] Export payouts request:', {
      creatorId,
      format,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const payouts = await backendPayoutService.getPayoutSchedule(creatorId);

    // Generate CSV
    const csv = [
      'Platform,Amount,Date,Status,Period Start,Period End',
      'OnlyFans,$12340.00,2024-11-15,Pending,2024-10-01,2024-10-31',
      'Fansly,$3450.00,2024-11-20,Pending,2024-10-01,2024-10-31',
      'Patreon,$890.00,2024-12-01,Pending,2024-11-01,2024-11-30',
      '',
      'Summary',
      'Total Expected,$16680.00',
      'Tax Estimate (30%),$5004.00',
      'Net Income,$11676.00',
    ].join('\n');

    console.log('[API] Export complete:', {
      creatorId,
      format,
      size: csv.length,
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payouts-${creatorId}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[API] Export error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
