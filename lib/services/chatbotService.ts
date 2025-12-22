import OpenAI from 'openai';

// Lazy OpenAI client instantiation to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 20_000,
      maxRetries: 1,
    });
  }
  return openai;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatbotContext {
  userId?: string;
  currentPage?: string;
  userRole?: string;
}

export class ChatbotService {
  private static getSystemPrompt(context?: ChatbotContext): string {
    let prompt = `You are Huntaze AI Assistant, a helpful and friendly AI assistant for the Huntaze platform.

Huntaze is a comprehensive CRM and content management platform for content creators.

Key features:
1. OnlyFans CRM
   - Fan management and segmentation
   - Automated messaging with rate limiting
   - Bulk campaigns
   - AI-powered message suggestions
   - CSV import for fan data

2. Content Creation
   - Rich text editor with emojis
   - Image and video editing
   - AI caption and hashtag generation
   - Template system
   - Platform-specific optimization
   - Content scheduling and calendar
   - A/B testing with variations

3. Social Media Integration
   - TikTok: OAuth, video upload, analytics
   - Instagram: OAuth, publish (Feed/Story/Reel), insights
   - Reddit: OAuth, post submission
   - Token encryption and auto-refresh
   - Webhook synchronization

4. Advanced Analytics
   - Unified metrics across platforms
   - Trend analysis
   - Audience insights
   - Custom report generation
   - Performance tracking

5. AI Tools
   - Caption generation
   - Hashtag suggestions
   - Content optimization
   - Message suggestions for OnlyFans

Your role:
- Answer questions about features
- Guide users through workflows
- Provide best practices
- Troubleshoot issues
- Suggest optimizations

Be concise, friendly, and actionable.`;

    if (context?.currentPage) {
      prompt += `\n\nUser is currently on: ${context.currentPage}`;
    }

    if (context?.userRole) {
      prompt += `\nUser role: ${context.userRole}`;
    }

    return prompt;
  }

  static async chat(
    message: string,
    history: ChatMessage[] = [],
    context?: ChatbotContext
  ): Promise<string> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: this.getSystemPrompt(context),
      },
    ];

    // Add conversation history (last 10 messages)
    history.slice(-10).forEach((msg) => {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 
      'Sorry, I couldn\'t generate a response. Please try again.';
  }

  static async getSuggestions(topic: string): Promise<string[]> {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Generate 3 helpful questions a user might ask about this topic. Return only the questions, one per line.',
        },
        {
          role: 'user',
          content: `Topic: ${topic}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || '';
    return response.split('\n').filter((q) => q.trim().length > 0).slice(0, 3);
  }
}
