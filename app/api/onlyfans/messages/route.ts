import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { onlyfansIntegration } from '@/lib/onlyfans/api-client';
import { realtimeAnalytics } from '@/lib/analytics/realtime-analytics';
import { makeReqLogger } from '@/lib/logger';

function getRequestIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ipAddress = getRequestIp(request);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fanId = searchParams.get('fanId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const log = makeReqLogger({ requestId, userId: userId ?? undefined });

    if (!userId) {
      const r = NextResponse.json({ error: 'User ID is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const messagesResponse = fanId
      ? await onlyfansIntegration.getMessages({ userId, chatId: fanId, limit, offset, ipAddress })
      : await onlyfansIntegration.listChats({ userId, limit, offset, ipAddress });

    const rawMessages = Array.isArray(messagesResponse?.list)
      ? messagesResponse.list
      : Array.isArray(messagesResponse?.messages)
        ? messagesResponse.messages
        : Array.isArray(messagesResponse)
          ? messagesResponse
          : [];

    const messages = rawMessages.map((message: any) => ({
      id: message.id || message.uuid || crypto.randomUUID(),
      fanId: message.withUser?.id || message.user?.id || fanId || '',
      body: message.text || message.body || message.lastMessage || '',
      createdAt: message.createdAt || message.created_at || new Date().toISOString(),
      raw: message,
    }));

    await realtimeAnalytics.trackEvent({
      userId,
      eventType: 'pageview',
      metadata: {
        page: 'messages',
        fanId,
        messageCount: messages.length,
      },
    });

    const hasMore = Boolean(messagesResponse?.hasMore || messagesResponse?.has_more);

    const r = NextResponse.json({
      messages,
      hasMore,
      nextOffset: offset + messages.length,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const log = makeReqLogger({ requestId });
    log.error('of_messages_fetch_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error?.message || 'Failed to fetch messages', requestId },
      { status: error?.statusCode || 500 },
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ipAddress = getRequestIp(request);

  try {
    const { userId, fanId, message, price } = await request.json();
    const log = makeReqLogger({ requestId, userId });

    if (!userId || !fanId || !message) {
      const r = NextResponse.json(
        { error: 'User ID, fan ID, and message are required', requestId },
        { status: 400 },
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const result = await onlyfansIntegration.sendMessage({
      userId,
      recipientId: fanId,
      text: message,
      price,
      ipAddress,
    });

    await realtimeAnalytics.trackMessage(userId, fanId, 'sent', false);

    const r = NextResponse.json({
      messageId: result?.id || result?.response?.id || crypto.randomUUID(),
      status: 'sent',
      timestamp: new Date().toISOString(),
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const log = makeReqLogger({ requestId });
    log.error('of_message_send_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error?.message || 'Failed to send message', requestId },
      { status: error?.statusCode || 500 },
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
