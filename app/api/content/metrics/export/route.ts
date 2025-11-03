import { NextRequest, NextResponse } from 'next/server';
import { productivityMetricsService } from '@/lib/services/productivityMetricsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30';
    const format = searchParams.get('format') || 'csv';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const metrics = await productivityMetricsService.getMetrics(userId, startDate, endDate);

    if (format === 'csv') {
      // Generate CSV
      const csvLines = [
        'Content Creation Report',
        `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        '',
        'Summary',
        `Total Content Created,${metrics.contentCreated.total}`,
        `Average Creation Time (minutes),${metrics.averageCreationTime.overall.toFixed(2)}`,
        `Content Per Day,${metrics.productivity.contentPerDay.toFixed(2)}`,
        `Content Per Week,${metrics.productivity.contentPerWeek.toFixed(2)}`,
        `Content Per Month,${metrics.productivity.contentPerMonth.toFixed(2)}`,
        '',
        'Content by Status',
        'Status,Count',
        ...Object.entries(metrics.contentCreated.byStatus).map(([status, count]) => `${status},${count}`),
        '',
        'Platform Distribution',
        'Platform,Count',
        ...Object.entries(metrics.platformDistribution).map(([platform, count]) => `${platform},${count}`),
        '',
        'Template Usage',
        'Template Name,Usage Count',
        ...metrics.templateUsage.map(t => `${t.templateName},${t.usageCount}`),
        '',
        'Media Usage',
        `Total Uploads,${metrics.mediaUsage.totalUploads}`,
        `Total Size (bytes),${metrics.mediaUsage.totalSize}`,
        ...Object.entries(metrics.mediaUsage.byType).map(([type, count]) => `${type},${count}`),
        '',
        'Daily Content Creation',
        'Date,Count',
        ...metrics.contentCreated.byPeriod.map(p => `${p.date},${p.count}`)
      ];

      const csv = csvLines.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="content-metrics-${Date.now()}.csv"`
        }
      });
    } else {
      // Return JSON for other formats
      return NextResponse.json({
        success: true,
        metrics,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error exporting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}
