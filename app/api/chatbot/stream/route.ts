/**
 * SSE Streaming pour Chatbot (Production-grade)
 * 
 * Features:
 * - Server-Sent Events (SSE)
 * - Traverse mieux les proxies que WebSocket
 * - Headers optimisés pour ALB/Nginx
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get('message');
  const conversationId = searchParams.get('conversationId');

  if (!message) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Helper to send SSE event
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Send ready event
        sendEvent('ready', { conversationId });
        
        // Simulate AI streaming (replace with actual AI service)
        // Example: OpenAI, Anthropic, etc.
        const tokens = message.split(' ');
        
        for (const token of tokens) {
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Send token
          sendEvent('token', { token });
        }
        
        // Send done event
        sendEvent('done', { 
          conversationId,
          messageCount: tokens.length 
        });
        
      } catch (error) {
        console.error('[Chatbot Stream] Error:', error);
        sendEvent('error', { 
          message: 'Failed to generate response' 
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx/ALB
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Client usage example:
 * 
 * const eventSource = new EventSource(
 *   `/api/chatbot/stream?message=${encodeURIComponent(message)}&conversationId=${id}`
 * );
 * 
 * eventSource.addEventListener('ready', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Stream ready:', data);
 * });
 * 
 * eventSource.addEventListener('token', (event) => {
 *   const { token } = JSON.parse(event.data);
 *   // Append token to UI
 * });
 * 
 * eventSource.addEventListener('done', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Stream done:', data);
 *   eventSource.close();
 * });
 * 
 * eventSource.addEventListener('error', (event) => {
 *   const { message } = JSON.parse(event.data);
 *   console.error('Stream error:', message);
 *   eventSource.close();
 * });
 */
