/**
 * API Endpoint - Campaign Status Monitoring
 * 
 * Endpoint pour monitorer le statut des campagnes en temps réel
 * GET /api/v2/campaigns/status/:workflowId - Obtenir le statut d'une campagne
 * GET /api/v2/campaigns/status - Obtenir tous les statuts pour un utilisateur
 * 
 * @module api/v2/campaigns/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    // Si workflowId spécifique
    if (workflowId) {
      // Mock data pour l'instant - dans une vraie implémentation, on récupérerait depuis RDS
      const mockWorkflow = {
        workflowId,
        userId: session.user.id,
        status: 'completed',
        currentProvider: 'azure',
        providerStates: {
          azure: 'completed',
          openai: 'pending',
          rateLimiter: 'completed',
          onlyFans: 'completed'
        },
        startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        completedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
        duration: 3 * 60 * 1000, // 3 minutes
        cost: {
          total: 0.05,
          breakdown: {
            azure: 0.03,
            openai: 0.02
          }
        },
        metrics: {
          tokensUsed: 2500,
          requestsCount: 3,
          retryAttempts: 0,
          fallbacksUsed: 0
        }
      };

      return NextResponse.json({
        success: true,
        data: mockWorkflow,
        metadata: {
          requestedBy: session.user.id,
          requestedAt: new Date().toISOString()
        }
      });
    }

    // Liste des workflows pour l'utilisateur
    const mockWorkflows = [
      {
        workflowId: 'wf_001',
        type: 'content_planning',
        status: 'completed',
        provider: 'azure',
        platforms: ['instagram', 'onlyfans'],
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        completedAt: new Date(Date.now() - 25 * 60 * 1000),
        duration: 5 * 60 * 1000,
        cost: 0.08
      },
      {
        workflowId: 'wf_002',
        type: 'message_generation',
        status: 'running',
        provider: 'openai',
        platforms: ['onlyfans'],
        startedAt: new Date(Date.now() - 2 * 60 * 1000),
        duration: 2 * 60 * 1000,
        cost: 0.02
      },
      {
        workflowId: 'wf_003',
        type: 'campaign_execution',
        status: 'failed',
        provider: 'azure',
        platforms: ['instagram', 'tiktok'],
        startedAt: new Date(Date.now() - 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 58 * 60 * 1000),
        duration: 2 * 60 * 1000,
        error: 'Rate limit exceeded'
      }
    ].filter(wf => !status || wf.status === status)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        workflows: mockWorkflows,
        summary: {
          total: mockWorkflows.length,
          byStatus: {
            completed: mockWorkflows.filter(w => w.status === 'completed').length,
            running: mockWorkflows.filter(w => w.status === 'running').length,
            failed: mockWorkflows.filter(w => w.status === 'failed').length
          },
          totalCost: mockWorkflows.reduce((sum, w) => sum + (w.cost || 0), 0)
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        filters: { status, limit }
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting campaign status:', error);
    
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
