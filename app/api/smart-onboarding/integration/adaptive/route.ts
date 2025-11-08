// Smart Onboarding - Adaptive Onboarding Integration API

import { NextRequest, NextResponse } from 'next/server';
import { AdaptiveOnboardingIntegrationImpl } from '@/lib/smart-onboarding/services/adaptiveOnboardingIntegration';
import { OnboardingContext } from '@/lib/smart-onboarding/interfaces/services';

// Mock existing onboarding service for demonstration
const mockExistingService = {
  async getUserOnboardingState(userId: string) {
    return { currentStep: 0, steps: [], completed: false };
  },
  async updateOnboardingProgress(userId: string, stepId: string, completed: boolean) {
    console.log(`Updated progress for ${userId}: ${stepId} = ${completed}`);
  },
  async getOnboardingConfiguration(userId: string) {
    return { theme: 'default', features: [] };
  },
  async completeOnboarding(userId: string) {
    console.log(`Completed onboarding for ${userId}`);
  }
};

const integration = new AdaptiveOnboardingIntegrationImpl(mockExistingService);

export async function POST(request: NextRequest) {
  try {
    const { action, userId, context, journey, userIds } = await request.json();
    
    switch (action) {
      case 'check_fallback':
        if (!userId || !context) {
          return NextResponse.json(
            { error: 'Missing userId or context' },
            { status: 400 }
          );
        }
        
        const needsFallback = await integration.checkFallbackNeeded(
          userId,
          context as OnboardingContext
        );
        
        return NextResponse.json({
          success: true,
          userId,
          needsFallback,
          recommendation: needsFallback ? 'use_fallback' : 'use_smart_onboarding',
          timestamp: new Date().toISOString()
        });
        
      case 'execute_fallback':
        if (!userId || !context) {
          return NextResponse.json(
            { error: 'Missing userId or context' },
            { status: 400 }
          );
        }
        
        const fallbackJourney = await integration.executeFallback(
          userId,
          context as OnboardingContext
        );
        
        return NextResponse.json({
          success: true,
          journey: fallbackJourney,
          message: 'Fallback executed successfully'
        });
        
      case 'sync_with_existing':
        if (!userId || !journey) {
          return NextResponse.json(
            { error: 'Missing userId or journey' },
            { status: 400 }
          );
        }
        
        await integration.syncWithExistingSystem(userId, journey);
        
        return NextResponse.json({
          success: true,
          message: 'Synced with existing system successfully'
        });
        
      case 'migrate_user':
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing userId' },
            { status: 400 }
          );
        }
        
        const migrationResult = await integration.migrateUserData(userId);
        
        return NextResponse.json({
          success: migrationResult.success,
          migration: migrationResult,
          message: migrationResult.message
        });
        
      case 'batch_migrate':
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { error: 'Missing or invalid userIds array' },
            { status: 400 }
          );
        }
        
        const batchResults = await integration.batchMigrateUsers(userIds);
        
        const successCount = batchResults.filter(r => r.success).length;
        const failureCount = batchResults.length - successCount;
        
        return NextResponse.json({
          success: true,
          batchResults,
          summary: {
            total: batchResults.length,
            successful: successCount,
            failed: failureCount,
            successRate: (successCount / batchResults.length) * 100
          },
          message: `Batch migration completed: ${successCount}/${batchResults.length} successful`
        });
        
      case 'create_compatibility_bridge':
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing userId' },
            { status: 400 }
          );
        }
        
        await integration.createCompatibilityBridge(userId);
        
        return NextResponse.json({
          success: true,
          message: 'Compatibility bridge created successfully'
        });
        
      case 'enable_bidirectional_sync':
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing userId' },
            { status: 400 }
          );
        }
        
        await integration.enableBidirectionalSync(userId);
        
        return NextResponse.json({
          success: true,
          message: 'Bidirectional sync enabled successfully'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in adaptive integration:', error);
    return NextResponse.json(
      { error: 'Failed to process integration request', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Get integration status
    const status = await integration.getIntegrationStatus(userId);
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting integration status:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}