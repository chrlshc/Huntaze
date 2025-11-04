import { NextRequest, NextResponse } from 'next/server';
import { ContextualHelpServiceImpl } from '@/lib/smart-onboarding/services/contextualHelpService';
import { AIHelpGeneratorImpl } from '@/lib/smart-onboarding/services/aiHelpGenerator';
import { logger } from '@/lib/utils/logger';

// Initialize services
const aiHelpGenerator = new AIHelpGeneratorImpl();
const contextualHelpService = new ContextualHelpServiceImpl(aiHelpGenerator);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, context, userState } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'generate_help':
        if (!context) {
          return NextResponse.json(
            { error: 'Context is required for help generation' },
            { status: 400 }
          );
        }

        const helpContent = await contextualHelpService.generateContextualHelp(
          userId,
          context,
          userState || {}
        );

        return NextResponse.json({
          success: true,
          data: {
            helpContent
          }
        });

      case 'progressive_disclosure':
        const { baseHelpId, userInteraction } = body;
        
        if (!baseHelpId) {
          return NextResponse.json(
            { error: 'Base help ID is required for progressive disclosure' },
            { status: 400 }
          );
        }

        // Get base help content (this would typically come from database)
        const baseHelp = {
          id: baseHelpId,
          type: 'contextual',
          content: 'Base help content',
          context: context || {}
        };

        const progressiveDisclosure = await contextualHelpService.implementProgressiveDisclosure(
          userId,
          baseHelp as any,
          userInteraction || {}
        );

        return NextResponse.json({
          success: true,
          data: {
            progressiveDisclosure
          }
        });

      case 'personalize_help':
        const { baseContent, personalization } = body;
        
        if (!baseContent || !personalization) {
          return NextResponse.json(
            { error: 'Base content and personalization data are required' },
            { status: 400 }
          );
        }

        const personalizedContent = await contextualHelpService.personalizeHelpContent(
          userId,
          baseContent,
          personalization
        );

        return NextResponse.json({
          success: true,
          data: {
            personalizedContent
          }
        });

      case 'optimize_help':
        const { helpContentId, effectivenessData } = body;
        
        if (!helpContentId || !effectivenessData) {
          return NextResponse.json(
            { error: 'Help content ID and effectiveness data are required' },
            { status: 400 }
          );
        }

        const optimizedContent = await contextualHelpService.optimizeHelpContent(
          helpContentId,
          effectivenessData
        );

        return NextResponse.json({
          success: true,
          data: {
            optimizedContent
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Contextual help API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, helpContentId, userResponse } = body;

    if (!userId || !helpContentId || !userResponse) {
      return NextResponse.json(
        { error: 'User ID, help content ID, and user response are required' },
        { status: 400 }
      );
    }

    // Get help content (this would typically come from database)
    const helpContent = {
      id: helpContentId,
      type: 'contextual',
      content: 'Help content',
      createdAt: new Date()
    };

    const effectiveness = await contextualHelpService.trackHelpEffectiveness(
      userId,
      helpContent as any,
      userResponse
    );

    return NextResponse.json({
      success: true,
      data: {
        effectiveness
      }
    });
  } catch (error) {
    logger.error('Help effectiveness tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ai_examples':
        const context = {
          stepId: searchParams.get('stepId') || 'unknown',
          topic: searchParams.get('topic') || 'general',
          userLevel: searchParams.get('userLevel') || 'intermediate'
        };
        const count = parseInt(searchParams.get('count') || '3');

        const examples = await aiHelpGenerator.generateExamples(context, count);

        return NextResponse.json({
          success: true,
          data: {
            examples
          }
        });

      case 'visual_aids':
        const visualContext = {
          stepId: searchParams.get('stepId') || 'unknown',
          topic: searchParams.get('topic') || 'general'
        };

        const visualAids = await aiHelpGenerator.generateVisualAids(visualContext);

        return NextResponse.json({
          success: true,
          data: {
            visualAids
          }
        });

      case 'interactive_elements':
        const interactiveContext = {
          stepId: searchParams.get('stepId') || 'unknown',
          topic: searchParams.get('topic') || 'general'
        };

        const interactiveElements = await aiHelpGenerator.generateInteractiveElements(interactiveContext);

        return NextResponse.json({
          success: true,
          data: {
            interactiveElements
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Contextual help GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}