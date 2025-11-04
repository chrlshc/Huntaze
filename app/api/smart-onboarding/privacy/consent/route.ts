import { NextRequest, NextResponse } from 'next/server';
import { userConsentManager } from '../../../../../lib/smart-onboarding/services/userConsentManager';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId, consents, source, metadata } = await request.json();
    
    if (!userId || !consents) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, consents' },
        { status: 400 }
      );
    }

    // Collect consent
    await userConsentManager.collectConsent(userId, consents, source, metadata);

    return NextResponse.json({
      success: true,
      message: 'Consent recorded successfully'
    });

  } catch (error) {
    logger.error('Failed to record consent', { error });
    
    if (error instanceof Error && error.message.includes('Required consent not granted')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (action === 'banner-config') {
      const config = await userConsentManager.getConsentBannerConfig(userId || undefined);
      return NextResponse.json({ config });
    }

    if (action === 'configuration') {
      const config = userConsentManager.getConsentConfiguration();
      return NextResponse.json({ config });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    if (action === 'check-update') {
      const requiresUpdate = await userConsentManager.requiresConsentUpdate(userId);
      return NextResponse.json({ requiresUpdate });
    }

    if (action === 'report') {
      const report = await userConsentManager.generateConsentReport(userId);
      return NextResponse.json({ report });
    }

    // Get user consents
    const consents = await userConsentManager.getUserConsents(userId);
    return NextResponse.json({ consents });

  } catch (error) {
    logger.error('Failed to get consent information', { error });
    return NextResponse.json(
      { error: 'Failed to get consent information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, consentType, granted, source } = await request.json();
    
    if (!userId || !consentType || granted === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, consentType, granted' },
        { status: 400 }
      );
    }

    await userConsentManager.updateConsent(userId, consentType, granted, source);

    return NextResponse.json({
      success: true,
      message: 'Consent updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update consent', { error });
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    await userConsentManager.revokeAllConsent(userId);

    return NextResponse.json({
      success: true,
      message: 'All non-essential consent revoked successfully'
    });

  } catch (error) {
    logger.error('Failed to revoke consent', { error });
    return NextResponse.json(
      { error: 'Failed to revoke consent' },
      { status: 500 }
    );
  }
}