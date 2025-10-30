import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// POST /api/content/ai-generate - Generate AI content
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, prompt, style, length, tone } = body;

    if (!type || !prompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type and prompt are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check user's AI generation quota
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayGenerations = await prisma.aiGeneration.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    // Limit to 50 generations per day (adjust based on plan)
    if (todayGenerations >= 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Daily AI generation quota exceeded',
          },
        },
        { status: 429 }
      );
    }

    // Mock AI generation (replace with actual AI service)
    const generatedContent = await generateAIContent({
      type,
      prompt,
      style,
      length,
      tone,
    });

    // Save generation record
    const aiGeneration = await prisma.aiGeneration.create({
      data: {
        userId,
        type,
        prompt,
        result: generatedContent,
        metadata: JSON.stringify({ style, length, tone }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: aiGeneration.id,
        content: generatedContent,
        type,
        generationsLeft: 50 - todayGenerations - 1,
      },
    });
  } catch (error) {
    console.error('[AI Generate API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate AI content',
        },
      },
      { status: 500 }
    );
  }
}

// Mock AI content generation function
async function generateAIContent(params: {
  type: string;
  prompt: string;
  style?: string;
  length?: string;
  tone?: string;
}): Promise<string> {
  const { type, prompt, style, length, tone } = params;

  // Mock responses based on type
  switch (type) {
    case 'message':
      return `Hey babe! 💕 ${prompt} Hope you're having an amazing day! Can't wait to chat with you more. What are you up to? 😘`;
    
    case 'caption':
      return `✨ ${prompt} ✨\n\nFeeling absolutely amazing today! What do you think of this look? Drop a comment and let me know! 💖\n\n#OnlyFans #Content #Beautiful`;
    
    case 'bio':
      return `💋 Your favorite girl next door 💋\n🌟 ${prompt}\n📸 Daily exclusive content\n💌 Always reply to DMs\n👇 Link below for more 👇`;
    
    case 'story':
      return `Once upon a time, ${prompt}... This story takes an exciting turn when our protagonist discovers something unexpected. The adventure continues with thrilling moments and surprising revelations that will keep you engaged until the very end.`;
    
    default:
      return `Here's your generated content based on: ${prompt}. This content has been crafted with ${style || 'default'} style, ${length || 'medium'} length, and ${tone || 'friendly'} tone.`;
  }
}
