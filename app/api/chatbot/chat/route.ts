import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `You are Huntaze AI Assistant, a helpful and friendly AI assistant for the Huntaze platform.

Huntaze is a comprehensive CRM and content management platform for content creators, specifically designed for OnlyFans creators and social media influencers.

Key features you can help with:
- OnlyFans CRM: Fan management, messaging, bulk campaigns, AI-powered message suggestions
- Content Creation: Create, edit, and schedule content for multiple platforms (TikTok, Instagram, Twitter)
- Social Media Integration: Connect and publish to TikTok, Instagram, Reddit
- Analytics: Track performance across all platforms, audience insights, trend analysis
- AI Tools: Caption generation, hashtag suggestions, content optimization

Your role:
- Answer questions about Huntaze features
- Help users navigate the platform
- Provide tips for content creation and fan engagement
- Suggest best practices for social media growth
- Troubleshoot common issues

Be concise, friendly, and helpful. If you don't know something specific about the platform, be honest and suggest contacting support.`,
      },
    ];

    // Add conversation history (last 5 messages for context)
    if (Array.isArray(history)) {
      history.slice(-5).forEach((msg: Message) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      'Sorry, I couldn\'t generate a response. Please try again.';

    return NextResponse.json({
      message: assistantMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
