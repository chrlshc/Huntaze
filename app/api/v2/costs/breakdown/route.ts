/**
 * API Endpoint - Cost Breakdown
 * 
 * Endpoint pour obtenir la répartition détaillée des coûts AI
 * GET /api/v2/costs/breakdown?startDate=...&endDate=...&userId=...
 * 
 * @module api/v2/costs/breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { costMonitoringService } from '@/lib/services/cost-monitoring-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Paramètres de requête
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const userIdParam = searchParams.get('userId');
    
    // Validation des dates
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }
    
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
        { status: 400 }
      );
    }
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }
    
    // Limite de 90 jours maximum
    const maxDays = 90;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${maxDays} days` },
        { status: 400 }
      );
    }
    
    // Vérification des permissions
    const requestedUserId = userIdParam || session.user.id;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    
    if (requestedUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view other users cost data' },
        { status: 403 }
      );
    }
    
    // Obtenir la répartition des coûts
    const costBreakdown = await costMonitoringService.getCostBreakdown(
      startDate,
      endDate,
      requestedUserId !== session.user.id ? requestedUserId : undefined
    );
    
    // Ajouter des métadonnées de réponse
    const response = {
      success: true,
      data: costBreakdown,
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: daysDiff
        },
        userId: requestedUserId
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error getting cost breakdown:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}