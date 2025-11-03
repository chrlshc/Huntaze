import { NextRequest, NextResponse } from 'next/server';
import { productivityMetricsService } from '@/lib/services/productivityMetricsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30'; // days

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

    return NextResponse.json({
      success: true,
      metrics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
