/**
 * Web Vitals Alert API
 * 
 * Handles alerts when Web Vitals exceed thresholds
 * Logs to CloudWatch and can trigger SNS notifications
 * 
 * Requirements: 2.4, 9.2
 * Property 9: Performance alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const cloudWatchLogs = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const LOG_GROUP_NAME = '/huntaze/web-vitals-alerts';
const LOG_STREAM_NAME = 'performance-alerts';

interface AlertRequest {
  metricName: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  context: {
    url: string;
    userAgent: string;
    connection?: string;
    timestamp: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const alert: AlertRequest = await request.json();
    
    // Validate request
    if (!alert.metricName || !alert.value || !alert.threshold) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create alert message
    const alertMessage = {
      timestamp: new Date().toISOString(),
      severity: alert.severity,
      metric: alert.metricName,
      value: alert.value,
      threshold: alert.threshold,
      exceedance: `${Math.round(((alert.value - alert.threshold) / alert.threshold) * 100)}%`,
      context: alert.context,
      message: `${alert.metricName} exceeded threshold: ${alert.value} > ${alert.threshold}`,
    };
    
    // Log to CloudWatch
    if (process.env.AWS_ACCESS_KEY_ID) {
      try {
        await cloudWatchLogs.send(
          new PutLogEventsCommand({
            logGroupName: LOG_GROUP_NAME,
            logStreamName: LOG_STREAM_NAME,
            logEvents: [
              {
                timestamp: Date.now(),
                message: JSON.stringify(alertMessage),
              },
            ],
          })
        );
      } catch (error) {
        console.error('Failed to log alert to CloudWatch:', error);
        // Continue even if CloudWatch logging fails
      }
    }
    
    // Log locally for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Web Vitals Alert:', alertMessage);
    }
    
    // In production, you could also send to SNS for notifications
    // await sendSNSNotification(alertMessage);
    
    return NextResponse.json({
      success: true,
      alert: alertMessage,
    });
  } catch (error) {
    console.error('Error processing alert:', error);
    return NextResponse.json(
      { error: 'Failed to process alert' },
      { status: 500 }
    );
  }
}
