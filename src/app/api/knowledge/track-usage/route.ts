import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Simple auth check for internal API
function checkAuth(request: NextRequest): { userId: string } | null {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey === process.env.INTERNAL_API_KEY) {
    return { userId: '1' }; // Default system user
  }
  
  // Check for user ID in header (for development)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return { userId };
  }
  
  return null;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { strategyId, success, userId } = body;

    if (!strategyId) {
      return NextResponse.json(
        { error: 'strategyId is required' },
        { status: 400 }
      );
    }

    // Update usage statistics
    const updateData: any = {
      lastUsedAt: new Date(),
    };

    if (success) {
      // If strategy was successful, boost its score and track revenue
      await prisma.$executeRaw`
        UPDATE "KnowledgeBaseItem"
        SET 
          "lastUsedAt" = NOW(),
          "updatedAt" = NOW(),
          score = GREATEST(0, LEAST(100, score + 5)), -- Boost score by 5 points
          payload = jsonb_set(
            jsonb_set(
              payload,
              '{usageCount}',
              COALESCE((payload->>'usageCount')::int, 0) + 1
            ),
            '{successCount}',
            COALESCE((payload->>'successCount')::int, 0) + 1
          )
        WHERE id = ${strategyId}
          AND ("creatorId" = ${parseInt(auth.userId)} OR "creatorId" IS NULL)
      `;

      // Update revenue if provided
      if (body.revenue) {
        await prisma.$executeRaw`
          UPDATE "KnowledgeBaseItem"
          SET 
            "revenueUsd" = COALESCE("revenueUsd", 0) + ${body.revenue},
            payload = jsonb_set(
              payload,
              '{totalRevenue}',
              COALESCE((payload->>'totalRevenue')::decimal, 0) + ${body.revenue}
            )
          WHERE id = ${strategyId}
        `;
      }
    } else {
      // If strategy failed or was ignored, just increment usage count
      await prisma.$executeRaw`
        UPDATE "KnowledgeBaseItem"
        SET 
          "lastUsedAt" = NOW(),
          "updatedAt" = NOW(),
          payload = jsonb_set(
            payload,
            '{usageCount}',
            COALESCE((payload->>'usageCount')::int, 0) + 1
          )
        WHERE id = ${strategyId}
          AND ("creatorId" = ${parseInt(auth.userId)} OR "creatorId" IS NULL)
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully',
    });

  } catch (error) {
    console.error('Knowledge usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get usage statistics for the user's knowledge items
    const stats = await prisma.$queryRaw<Array<{
      totalUsage: bigint;
      avgScore: number;
      topStrategy: string;
    }>>`
      SELECT 
        COUNT(*) as "totalUsage",
        AVG(score) as "avgScore",
        (SELECT title FROM "KnowledgeBaseItem" 
         WHERE "creatorId" = ${parseInt(auth.userId)} 
         ORDER BY payload->>'usageCount' DESC NULLS LAST 
         LIMIT 1) as "topStrategy"
      FROM "KnowledgeBaseItem"
      WHERE "creatorId" = ${parseInt(auth.userId)}
        AND "lastUsedAt" IS NOT NULL
    `;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsage: Number(stats[0]?.totalUsage || 0),
        avgScore: Number(stats[0]?.avgScore || 0),
        topStrategy: stats[0]?.topStrategy || 'None',
      },
    });

  } catch (error) {
    console.error('Knowledge stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
