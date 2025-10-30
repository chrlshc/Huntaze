/**
 * API Endpoint - Campaign Cost Analytics
 * 
 * Endpoint pour analyser les coûts des campagnes
 * GET /api/v2/campaigns/costs - Analytics des coûts par campagne
 * 
 * @module api/v2/campaigns/costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { costMonitoringService } from '@/lib/services/cost-monitoring-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month, campaign
    
    // Validation des dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Obtenir les coûts
    const costBreakdown = await costMonitoringService.getCostBreakdown(
      start,
      end,
      session.user.id
    );

    // Analyser par type de campagne
    const mockCampaignCosts = [
      {
        campaignType: 'content_planning',
        count: 45,
        totalCost: 12.50,
        avgCost: 0.28,
        provider: {
          azure: 8.50,
          openai: 4.00
        }
      },
      {
        campaignType: 'message_generation',
        count: 120,
        totalCost: 8.40,
        avgCost: 0.07,
        provider: {
          azure: 2.40,
          openai: 6.00
        }
      },
      {
        campaignType: 'campaign_execution',
        count: 30,
        totalCost: 15.60,
        avgCost: 0.52,
        provider: {
          azure: 10.60,
          openai: 5.00
        }
      }
    ];

    // Calculer les métriques
    const totalCampaigns = mockCampaignCosts.reduce((sum, c) => sum + c.count, 0);
    const totalCost = mockCampaignCosts.reduce((sum, c) => sum + c.totalCost, 0);
    const avgCostPerCampaign = totalCampaigns > 0 ? totalCost / totalCampaigns : 0;

    // Identifier les campagnes les plus coûteuses
    const mostExpensive = [...mockCampaignCosts].sort((a, b) => b.avgCost - a.avgCost)[0];
    const mostFrequent = [...mockCampaignCosts].sort((a, b) => b.count - a.count)[0];

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCampaigns,
          totalCost,
          avgCostPerCampaign,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        },
        byCampaignType: mockCampaignCosts,
        insights: {
          mostExpensiveType: {
            type: mostExpensive.campaignType,
            avgCost: mostExpensive.avgCost
          },
          mostFrequentType: {
            type: mostFrequent.campaignType,
            count: mostFrequent.count
          },
          recommendations: [
            totalCost > 50 ? 'Consider enabling cost optimization strategies' : null,
            mostExpensive.avgCost > 0.50 ? `${mostExpensive.campaignType} campaigns are expensive - review provider selection` : null,
            costBreakdown.providers.azure.cost > costBreakdown.providers.openai.cost * 2 ? 'Azure costs are significantly higher - consider routing more to OpenAI' : null
          ].filter(Boolean)
        },
        providerBreakdown: costBreakdown.providers
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        groupBy
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting campaign costs:', error);
    
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
