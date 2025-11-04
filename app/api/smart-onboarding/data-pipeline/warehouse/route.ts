import { NextRequest, NextResponse } from 'next/server';
import { dataWarehouseService } from '../../../../../lib/smart-onboarding/services/dataWarehouseService';
import { logger } from '../../../../../lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await dataWarehouseService.getWarehouseStats();
        return NextResponse.json({
          success: true,
          stats
        });

      case 'health':
        return NextResponse.json({
          success: true,
          status: 'operational',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: true,
          availableActions: ['stats', 'health', 'dataset']
        });
    }

  } catch (error) {
    logger.error('Data warehouse GET endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'create-dataset':
        const criteria = {
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          userIds: body.userIds,
          eventTypes: body.eventTypes,
          minQualityScore: body.minQualityScore
        };

        const dataset = await dataWarehouseService.createTrainingDataset(criteria);
        
        return NextResponse.json({
          success: true,
          dataset: {
            id: dataset.id,
            createdAt: dataset.createdAt,
            metadata: dataset.metadata
          }
        });

      case 'queue-data':
        if (!body.data) {
          return NextResponse.json(
            { error: 'Data is required' },
            { status: 400 }
          );
        }

        await dataWarehouseService.queueForWarehouse(body.data);
        
        return NextResponse.json({
          success: true,
          message: 'Data queued for warehouse processing'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Data warehouse POST endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}