export type LogLike = Record<string, any>;

export const withTs = <T extends LogLike>(o: T) => ({
  ts: new Date().toISOString(),
  ...o,
});

// Replace with your backend logger (pino/Datadog/etc.).
// Default: console JSON logger.
import base from './base-logger';

type Ctx = { requestId?: string; userId?: string; route?: string; method?: string };

export const makeReqLogger = (ctx: Ctx) => {
  const sink: any = (globalThis as any).__BASE_LOGGER__ ?? base;
  const wrap = (level: 'info' | 'warn' | 'error') =>
    (evt: string, props: Record<string, any> = {}) =>
      sink[level](withTs({
        evt,
        requestId: ctx.requestId,
        userId: ctx.userId,
        route: ctx.route,
        method: ctx.method,
        ...props,
      }));

  return {
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
  } as const;
};

// Example event typings (optional)
export type AiChatCompleted = {
  evt: 'ai_chat_completed';
  plan: 'starter' | 'pro' | 'scale';
  premiumRouted: boolean;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export type AiChatRateLimited = {
  evt: 'ai_chat_rate_limited';
  code: 'daily_message_limit_reached' | 'monthly_token_limit_reached';
  limit: number;
  resetAt: string;
};
