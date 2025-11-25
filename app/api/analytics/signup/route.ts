import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-client';

/**
 * POST /api/analytics/signup
 * 
 * Receives and stores signup funnel analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      event,
      timestamp,
      sessionId,
      userId,
      email,
      metadata = {},
    } = data;
    
    // Validate required fields
    if (!event || !timestamp || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Map event to database fields
    const eventData: any = {
      sessionId,
      createdAt: new Date(timestamp),
    };
    
    // Add user info if available
    if (userId) eventData.userId = userId;
    if (email) eventData.email = email;
    
    // Add device info
    if (metadata.userAgent) eventData.userAgent = metadata.userAgent;
    if (metadata.deviceType) eventData.deviceType = metadata.deviceType;
    if (metadata.browser) eventData.browser = metadata.browser;
    if (metadata.os) eventData.os = metadata.os;
    
    // Add UTM parameters
    if (metadata.utmSource) eventData.utmSource = metadata.utmSource;
    if (metadata.utmMedium) eventData.utmMedium = metadata.utmMedium;
    if (metadata.utmCampaign) eventData.utmCampaign = metadata.utmCampaign;
    
    // Add referrer and landing page
    if (metadata.referrer) eventData.referrer = metadata.referrer;
    if (metadata.landingPage) eventData.landingPage = metadata.landingPage;
    
    // Map event-specific data
    switch (event) {
      case 'signup_page_viewed':
        eventData.pageViewed = new Date(timestamp);
        break;
        
      case 'signup_form_started':
        eventData.formStarted = new Date(timestamp);
        break;
        
      case 'signup_method_selected':
        eventData.methodSelected = metadata.method;
        break;
        
      case 'signup_form_submitted':
        eventData.formSubmitted = new Date(timestamp);
        eventData.methodSelected = metadata.method;
        if (metadata.timeToSubmit) {
          eventData.timeToSubmit = metadata.timeToSubmit;
        }
        break;
        
      case 'signup_success':
        eventData.signupCompleted = new Date(timestamp);
        eventData.methodSelected = metadata.method;
        if (metadata.timeToComplete) {
          eventData.timeToComplete = metadata.timeToComplete;
        }
        break;
        
      case 'signup_error':
        eventData.signupFailed = new Date(timestamp);
        eventData.methodSelected = metadata.method;
        eventData.errorCode = metadata.errorCode;
        eventData.errorMessage = metadata.errorMessage;
        break;
    }
    
    // Find existing analytics record for this session or create new one
    const existing = await prisma.signupAnalytics.findFirst({
      where: { sessionId },
    });
    
    if (existing) {
      // Update existing record
      await prisma.signupAnalytics.update({
        where: { id: existing.id },
        data: eventData,
      });
    } else {
      // Create new record
      await prisma.signupAnalytics.create({
        data: eventData,
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    
    // Don't fail the request - analytics should never break user experience
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/signup
 * 
 * Retrieve signup funnel analytics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const method = searchParams.get('method');
    
    // Build query filters
    const where: any = {};
    
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      };
    }
    
    if (method) {
      where.methodSelected = method;
    }
    
    // Get analytics data
    const analytics = await prisma.signupAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to 1000 records
    });
    
    // Calculate funnel metrics
    const total = analytics.length;
    const pageViews = analytics.filter(a => a.pageViewed).length;
    const formStarts = analytics.filter(a => a.formStarted).length;
    const formSubmits = analytics.filter(a => a.formSubmitted).length;
    const completions = analytics.filter(a => a.signupCompleted).length;
    const errors = analytics.filter(a => a.signupFailed).length;
    
    // Calculate conversion rates
    const metrics = {
      total,
      pageViews,
      formStarts,
      formSubmits,
      completions,
      errors,
      conversionRates: {
        viewToStart: pageViews > 0 ? (formStarts / pageViews) * 100 : 0,
        startToSubmit: formStarts > 0 ? (formSubmits / formStarts) * 100 : 0,
        submitToComplete: formSubmits > 0 ? (completions / formSubmits) * 100 : 0,
        overall: pageViews > 0 ? (completions / pageViews) * 100 : 0,
      },
      averageTimes: {
        timeToSubmit: analytics
          .filter(a => a.timeToSubmit)
          .reduce((sum, a) => sum + (a.timeToSubmit || 0), 0) / formSubmits || 0,
        timeToComplete: analytics
          .filter(a => a.timeToComplete)
          .reduce((sum, a) => sum + (a.timeToComplete || 0), 0) / completions || 0,
      },
      byMethod: {
        email: analytics.filter(a => a.methodSelected === 'email').length,
        google: analytics.filter(a => a.methodSelected === 'google').length,
        apple: analytics.filter(a => a.methodSelected === 'apple').length,
      },
      byDevice: {
        mobile: analytics.filter(a => a.deviceType === 'mobile').length,
        tablet: analytics.filter(a => a.deviceType === 'tablet').length,
        desktop: analytics.filter(a => a.deviceType === 'desktop').length,
      },
    };
    
    return NextResponse.json({
      metrics,
      data: analytics,
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
