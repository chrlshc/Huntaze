import { NextRequest, NextResponse } from 'next/server';
import { dataPrivacyService } from '../../../../../lib/smart-onboarding/services/dataPrivacyService';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId, confirmationToken, reason } = await request.json();
    
    if (!userId || !confirmationToken) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, confirmationToken' },
        { status: 400 }
      );
    }

    // Validate confirmation token (in a real implementation, this would be a secure token)
    const expectedToken = generateConfirmationToken(userId);
    if (confirmationToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid confirmation token' },
        { status: 400 }
      );
    }

    // Log the deletion request
    logger.info('User data deletion requested', { userId, reason });

    // Delete user data
    await dataPrivacyService.deleteUserData(userId);

    // In a real implementation, you might want to:
    // 1. Send confirmation email
    // 2. Schedule delayed deletion (cooling-off period)
    // 3. Update user account status
    // 4. Notify relevant systems

    return NextResponse.json({
      success: true,
      message: 'User data deletion completed successfully',
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to delete user data', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    if (action === 'generate-token') {
      // Generate confirmation token for data deletion
      const token = generateConfirmationToken(userId);
      
      // In a real implementation, you would:
      // 1. Store the token with expiration
      // 2. Send it via secure channel (email)
      // 3. Add rate limiting
      
      return NextResponse.json({
        success: true,
        message: 'Confirmation token generated',
        // Don't return the actual token in production
        token: process.env.NODE_ENV === 'development' ? token : undefined
      });
    }

    if (action === 'preview') {
      // Preview what data would be deleted
      const userData = await dataPrivacyService.exportUserData(userId);
      
      const preview = {
        userId,
        dataTypes: Object.keys(userData).filter(key => key !== 'userId' && key !== 'exportDate'),
        estimatedRecords: calculateEstimatedRecords(userData),
        warningMessage: 'This action cannot be undone. All your data will be permanently deleted.'
      };

      return NextResponse.json({ preview });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=generate-token or ?action=preview' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Failed to process data deletion request', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function generateConfirmationToken(userId: string): string {
  // In a real implementation, this would be a cryptographically secure token
  // stored in the database with expiration time
  const crypto = require('crypto');
  const secret = process.env.DATA_DELETION_SECRET || 'default-secret';
  const timestamp = Math.floor(Date.now() / 1000 / 3600); // Valid for 1 hour
  
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${timestamp}`)
    .digest('hex')
    .substring(0, 16);
}

function calculateEstimatedRecords(userData: any): Record<string, number> {
  const estimates: Record<string, number> = {};
  
  if (userData.profile) {
    estimates.profile = 1;
  }
  
  if (userData.behavioralData?.behavioralEvents) {
    estimates.behavioralEvents = Array.isArray(userData.behavioralData.behavioralEvents) 
      ? userData.behavioralData.behavioralEvents.length 
      : 0;
  }
  
  if (userData.personalizationData) {
    estimates.personalizationData = 1;
  }
  
  if (userData.consentHistory) {
    estimates.consentRecords = Array.isArray(userData.consentHistory) 
      ? userData.consentHistory.length 
      : 0;
  }
  
  return estimates;
}