import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

/**
 * Automation Templates API
 * Pre-built automation templates for common workflows
 */

const AUTOMATION_TEMPLATES = [
  {
    id: 'welcome-new-subscriber',
    name: 'Welcome New Subscriber',
    description: 'Automatically send a welcome message when someone subscribes',
    category: 'engagement',
    trigger: { type: 'new_subscriber' },
    steps: [
      { type: 'delay', config: { minutes: 5 } },
      { type: 'send_message', config: { template: 'welcome' } },
    ],
    popularity: 95,
    estimatedImpact: '+15% retention',
  },
  {
    id: 'expiring-subscription-reminder',
    name: 'Expiring Subscription Reminder',
    description: 'Send a reminder before subscription expires',
    category: 'retention',
    trigger: { type: 'subscription_expiring', config: { daysBefore: 3 } },
    steps: [
      { type: 'send_message', config: { template: 'renewal_reminder' } },
    ],
    popularity: 88,
    estimatedImpact: '+20% renewals',
  },
  {
    id: 'inactive-fan-reengagement',
    name: 'Inactive Fan Re-engagement',
    description: 'Reach out to fans who haven\'t engaged in 7+ days',
    category: 'retention',
    trigger: { type: 'fan_inactive', config: { days: 7 } },
    steps: [
      { type: 'send_message', config: { template: 'miss_you' } },
      { type: 'delay', config: { days: 3 } },
      { type: 'condition', config: { check: 'no_response' } },
      { type: 'send_offer', config: { discount: 10 } },
    ],
    popularity: 82,
    estimatedImpact: '+12% reactivation',
  },
  {
    id: 'tip-thank-you',
    name: 'Tip Thank You',
    description: 'Send a personalized thank you when someone tips',
    category: 'engagement',
    trigger: { type: 'tip_received', config: { minAmount: 5 } },
    steps: [
      { type: 'send_message', config: { template: 'tip_thanks', personalized: true } },
    ],
    popularity: 90,
    estimatedImpact: '+25% repeat tips',
  },
  {
    id: 'ppv-follow-up',
    name: 'PPV Follow-up',
    description: 'Follow up with fans who viewed but didn\'t purchase PPV',
    category: 'sales',
    trigger: { type: 'ppv_viewed_not_purchased', config: { hours: 24 } },
    steps: [
      { type: 'send_message', config: { template: 'ppv_reminder' } },
    ],
    popularity: 75,
    estimatedImpact: '+18% conversions',
  },
  {
    id: 'birthday-message',
    name: 'Birthday Message',
    description: 'Send a special message on fan\'s birthday',
    category: 'engagement',
    trigger: { type: 'fan_birthday' },
    steps: [
      { type: 'send_message', config: { template: 'birthday' } },
      { type: 'send_offer', config: { discount: 15, validDays: 7 } },
    ],
    popularity: 70,
    estimatedImpact: '+30% engagement',
  },
];

/**
 * GET /api/automations/templates - List automation templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let templates = AUTOMATION_TEMPLATES;
    if (category && category !== 'all') {
      templates = templates.filter((t) => t.category === category);
    }

    // Sort by popularity
    templates = [...templates].sort((a, b) => b.popularity - a.popularity);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        categories: ['engagement', 'retention', 'sales'],
      },
    });
  } catch (error) {
    console.error('[Automation Templates GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/automations/templates/[id]/use - Create automation from template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, customizations } = body;

    const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    // Return the template config for the client to create the automation
    return NextResponse.json({
      success: true,
      data: {
        name: customizations?.name || template.name,
        description: template.description,
        trigger: template.trigger,
        steps: template.steps,
        fromTemplate: templateId,
      },
    });
  } catch (error) {
    console.error('[Automation Templates POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to use template' }, { status: 500 });
  }
}
