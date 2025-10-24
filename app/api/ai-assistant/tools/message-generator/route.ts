import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';
import { getAIService } from '@/lib/services/ai-service';

const MessageGeneratorSchema = z.object({
  fanName: z.string().min(1),
  fanProfile: z.object({
    subscriptionTier: z.enum(['basic', 'vip', 'premium']),
    totalSpent: z.number().min(0),
    lastActive: z.string().datetime(),
    preferences: z.array(z.string()).default([]),
    previousInteractions: z.array(z.string()).default([]),
  }),
  messageType: z.enum(['greeting', 'upsell', 'ppv_offer', 'reactivation', 'thank_you', 'custom']),
  tone: z.enum(['friendly', 'flirty', 'professional', 'playful', 'intimate']).default('friendly'),
  includeEmojis: z.boolean().default(true),
  maxLength: z.number().min(50).max(500).default(200),
  callToAction: z.string().optional(),
  customContext: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = MessageGeneratorSchema.safeParse(body);

    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid message generator data', 400, {
        errors: validatedData.error.errors,
      });
    }

    const {
      fanName,
      fanProfile,
      messageType,
      tone,
      includeEmojis,
      maxLength,
      callToAction,
      customContext,
    } = validatedData.data;

    try {
      const aiService = getAIService();

      // Build context-aware prompt
      const prompt = buildMessagePrompt({
        fanName,
        fanProfile,
        messageType,
        tone,
        includeEmojis,
        maxLength,
        callToAction,
        customContext,
      });

      const response = await aiService.generateText({
        prompt,
        context: {
          userId: auth.user.id,
          contentType: 'message',
          metadata: {
            fanName,
            messageType,
            tone,
            subscriptionTier: fanProfile.subscriptionTier,
          },
        },
        options: {
          temperature: 0.8, // More creative for personalized messages
          maxTokens: Math.ceil(maxLength * 1.5), // Account for token-to-character ratio
        },
      });

      // Parse and validate the generated message
      const generatedMessage = response.content.trim();
      
      // Basic validation
      if (generatedMessage.length > maxLength * 1.2) {
        // Truncate if too long
        const truncated = generatedMessage.substring(0, maxLength) + '...';
        console.warn('Generated message was too long, truncated');
      }

      return Response.json({
        success: true,
        data: {
          message: generatedMessage,
          metadata: {
            fanName,
            messageType,
            tone,
            length: generatedMessage.length,
            provider: response.provider,
            model: response.model,
          },
          usage: response.usage,
          suggestions: generateMessageSuggestions(messageType, tone),
        },
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
      });

    } catch (error: any) {
      console.error('Message generation error:', error);
      return jsonError('MESSAGE_GENERATION_FAILED', 'Failed to generate personalized message', 500, {
        error: error.message,
      });
    }
  });
}

function buildMessagePrompt(params: {
  fanName: string;
  fanProfile: any;
  messageType: string;
  tone: string;
  includeEmojis: boolean;
  maxLength: number;
  callToAction?: string;
  customContext?: string;
}): string {
  const {
    fanName,
    fanProfile,
    messageType,
    tone,
    includeEmojis,
    maxLength,
    callToAction,
    customContext,
  } = params;

  let basePrompt = `Create a personalized message for a fan named ${fanName}.`;

  // Add fan context
  basePrompt += `\n\nFan Profile:
- Subscription tier: ${fanProfile.subscriptionTier}
- Total spent: $${fanProfile.totalSpent}
- Last active: ${new Date(fanProfile.lastActive).toLocaleDateString()}`;

  if (fanProfile.preferences.length > 0) {
    basePrompt += `\n- Preferences: ${fanProfile.preferences.join(', ')}`;
  }

  if (fanProfile.previousInteractions.length > 0) {
    basePrompt += `\n- Previous interactions: ${fanProfile.previousInteractions.slice(-3).join('; ')}`;
  }

  // Add message type context
  const messageTypePrompts = {
    greeting: 'This is a friendly greeting message to welcome them or check in.',
    upsell: 'This is an upsell message to encourage them to upgrade their subscription or purchase premium content.',
    ppv_offer: 'This is a pay-per-view offer for exclusive content.',
    reactivation: 'This is a reactivation message for a fan who has been inactive.',
    thank_you: 'This is a thank you message for their support or recent purchase.',
    custom: customContext || 'This is a custom message.',
  };

  basePrompt += `\n\nMessage Type: ${messageTypePrompts[messageType as keyof typeof messageTypePrompts]}`;

  // Add tone guidance
  const toneGuidance = {
    friendly: 'Use a warm, approachable tone that feels genuine and caring.',
    flirty: 'Use a playful, flirtatious tone that\'s engaging but respectful.',
    professional: 'Use a professional, polite tone that maintains boundaries.',
    playful: 'Use a fun, energetic tone with humor and personality.',
    intimate: 'Use a more personal, intimate tone that creates connection.',
  };

  basePrompt += `\n\nTone: ${toneGuidance[tone as keyof typeof toneGuidance]}`;

  // Add formatting requirements
  basePrompt += `\n\nRequirements:
- Keep the message under ${maxLength} characters
- Make it feel personal and authentic, not robotic
- Reference their subscription tier (${fanProfile.subscriptionTier}) appropriately`;

  if (includeEmojis) {
    basePrompt += `\n- Include relevant emojis to make the message more engaging`;
  }

  if (callToAction) {
    basePrompt += `\n- Include this call to action: ${callToAction}`;
  }

  basePrompt += `\n\nGenerate only the message content, no additional text or explanations.`;

  return basePrompt;
}

function generateMessageSuggestions(messageType: string, tone: string): string[] {
  const suggestions: Record<string, string[]> = {
    greeting: [
      'Add a question about their day to encourage response',
      'Reference something from their profile or previous conversation',
      'Include a compliment about their support',
    ],
    upsell: [
      'Highlight exclusive benefits of upgrading',
      'Create urgency with limited-time offers',
      'Show appreciation for their current support first',
    ],
    ppv_offer: [
      'Tease the content without giving everything away',
      'Mention why this content is special or exclusive',
      'Include social proof if others have enjoyed similar content',
    ],
    reactivation: [
      'Acknowledge their absence without being pushy',
      'Share what they\'ve missed in a exciting way',
      'Offer a special welcome back incentive',
    ],
    thank_you: [
      'Be specific about what you\'re thanking them for',
      'Share how their support helps you create better content',
      'Hint at upcoming content they might enjoy',
    ],
  };

  return suggestions[messageType] || [
    'Keep the message authentic and personal',
    'Consider the fan\'s history and preferences',
    'End with an engaging question or call to action',
  ];
}