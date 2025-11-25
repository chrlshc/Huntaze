import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-client';

/**
 * POST /api/analytics/abandonment
 * 
 * Receives and stores signup form abandonment data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      sessionId,
      lastField,
      timeSpentOnField,
      totalTimeOnForm,
      fieldsInteracted,
      fieldInteractions,
      abandonmentReason,
      errorContext,
    } = data;
    
    // Validate required fields
    if (!sessionId || !lastField) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find existing analytics record for this session
    const existing = await prisma.signupAnalytics.findFirst({
      where: { sessionId },
    });
    
    if (!existing) {
      // No existing record - user may have abandoned before any tracking started
      // Create a minimal record
      await prisma.signupAnalytics.create({
        data: {
          sessionId,
          signupFailed: new Date(),
          errorCode: 'ABANDONMENT',
          errorMessage: `User abandoned form at field: ${lastField}`,
        },
      });
    } else {
      // Update existing record with abandonment data
      await prisma.signupAnalytics.update({
        where: { id: existing.id },
        data: {
          signupFailed: new Date(),
          errorCode: errorContext?.errorCode || 'ABANDONMENT',
          errorMessage: errorContext?.errorMessage || `Abandoned at ${lastField} after ${Math.round(totalTimeOnForm / 1000)}s`,
        },
      });
    }
    
    // Store detailed abandonment data in a separate table (if needed)
    // For now, we'll log it for analysis
    console.log('Form abandonment:', {
      sessionId,
      lastField,
      timeSpentOnField: Math.round(timeSpentOnField / 1000) + 's',
      totalTimeOnForm: Math.round(totalTimeOnForm / 1000) + 's',
      fieldsInteracted,
      abandonmentReason,
      errorContext,
      interactionCount: fieldInteractions.length,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Abandonment tracking error:', error);
    
    // Don't fail the request - analytics should never break user experience
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/abandonment
 * 
 * Retrieve abandonment analytics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query filters
    const where: any = {
      errorCode: 'ABANDONMENT',
    };
    
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      };
    }
    
    // Get abandonment data
    const abandonments = await prisma.signupAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    
    // Analyze abandonment patterns
    const fieldCounts: Record<string, number> = {};
    const reasonCounts: Record<string, number> = {};
    
    abandonments.forEach(a => {
      // Extract field from error message
      const fieldMatch = a.errorMessage?.match(/at field: (\w+)/);
      if (fieldMatch) {
        const field = fieldMatch[1];
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      }
      
      // Count by error code
      if (a.errorCode) {
        reasonCounts[a.errorCode] = (reasonCounts[a.errorCode] || 0) + 1;
      }
    });
    
    // Calculate metrics
    const metrics = {
      total: abandonments.length,
      byField: Object.entries(fieldCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([field, count]) => ({ field, count })),
      byReason: Object.entries(reasonCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([reason, count]) => ({ reason, count })),
      averageTimeOnForm: abandonments
        .filter(a => a.timeToComplete)
        .reduce((sum, a) => sum + (a.timeToComplete || 0), 0) / abandonments.length || 0,
    };
    
    return NextResponse.json({
      metrics,
      data: abandonments,
    });
  } catch (error) {
    console.error('Abandonment retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
