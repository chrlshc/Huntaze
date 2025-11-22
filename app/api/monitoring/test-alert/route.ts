/**
 * Test Alert API
 * 
 * Sends a test notification to verify SNS configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudWatchService } from '@/lib/monitoring/cloudwatch.service';

export async function POST(request: NextRequest) {
  try {
    await cloudWatchService.sendTestNotification();

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully. Check your email.',
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test notification',
      },
      { status: 500 }
    );
  }
}
