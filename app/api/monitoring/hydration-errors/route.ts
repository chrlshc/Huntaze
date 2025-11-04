import { NextRequest, NextResponse } from 'next/server';

export interface HydrationErrorReport {
  id: string;
  timestamp: string;
  errorType: 'mismatch' | 'timeout' | 'component_error';
  componentStack: string;
  url: string;
  userAgent: string;
  message: string;
  stack?: string;
  htmlDiffers: boolean;
  serverHTMLLength: number;
  clientHTMLLength: number;
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: HydrationErrorReport = await request.json();

    // Validate required fields
    if (!errorReport.id || !errorReport.timestamp || !errorReport.errorType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the error (in a real app, you'd send this to your monitoring service)
    console.error('Hydration Error Report:', {
      id: errorReport.id,
      type: errorReport.errorType,
      url: errorReport.url,
      timestamp: errorReport.timestamp,
      message: errorReport.message,
      htmlDiffers: errorReport.htmlDiffers,
    });

    // In production, you would:
    // 1. Send to monitoring service (Sentry, DataDog, etc.)
    // 2. Store in database for analysis
    // 3. Trigger alerts if error rate is high
    // 4. Update metrics dashboards

    // Example: Send to Sentry (if configured)
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(new Error(errorReport.message), {
      //   tags: {
      //     errorType: errorReport.errorType,
      //     hydrationError: true,
      //   },
      //   extra: {
      //     componentStack: errorReport.componentStack,
      //     htmlDiffers: errorReport.htmlDiffers,
      //     serverHTMLLength: errorReport.serverHTMLLength,
      //     clientHTMLLength: errorReport.clientHTMLLength,
      //   },
      // });
    }

    // Example: Store in database
    // await db.hydrationErrors.create({
    //   data: {
    //     id: errorReport.id,
    //     timestamp: new Date(errorReport.timestamp),
    //     errorType: errorReport.errorType,
    //     componentStack: errorReport.componentStack,
    //     url: errorReport.url,
    //     userAgent: errorReport.userAgent,
    //     message: errorReport.message,
    //     stack: errorReport.stack,
    //     htmlDiffers: errorReport.htmlDiffers,
    //     serverHTMLLength: errorReport.serverHTMLLength,
    //     clientHTMLLength: errorReport.clientHTMLLength,
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process hydration error report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return hydration error statistics
    // In a real app, you'd fetch this from your database
    
    const mockStats = {
      totalErrors: 0,
      errorsByType: {
        mismatch: 0,
        timeout: 0,
        component_error: 0,
      },
      errorsByHour: [], // Last 24 hours
      topAffectedPages: [],
      resolvedErrors: 0,
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Failed to fetch hydration error stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}