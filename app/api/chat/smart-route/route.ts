import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { chatWith, type ChatMessage } from '@/lib/ai/azure';
import { needsPremium, estimateTokens } from '@/lib/ai/heuristics';
import { getUsage, incrementUsage, getPlanLimits } from '@/lib/db/usage';
import { getUserById } from '@/lib/db/users-dynamo';
import { makeReqLogger } from '@/lib/logger';
import { sample } from '@/lib/log-sampling';

const bodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(['system','user','assistant']), content: z.string() })).min(1),
  temperature: z.number().min(0).max(1).optional(),
});

const DEPLOY_4O = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_4O || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '';
const DEPLOY_4OMINI = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_4OMINI || '';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Generate requestId early so we can always return header
  let requestId = crypto.randomUUID();
  try {
    const user = await requireUser();
    const json = await req.json();
    const { messages, temperature } = bodySchema.parse(json);

    // Resolve plan from USERS_TABLE to prevent spoofing via request body
    let plan: 'starter'|'pro'|'scale' = 'starter';
    try {
      const record: any = await getUserById(user.id);
      const tier: string = (record?.subscriptionTier || record?.plan || '').toString().toLowerCase();
      const map: Record<string, 'starter'|'pro'|'scale'> = {
        'free': 'starter', 'basic': 'starter', 'starter': 'starter',
        'premium': 'pro', 'pro': 'pro',
        'scale': 'scale', 'enterprise': 'scale'
      };
      plan = map[tier] || 'starter';
    } catch {}

    const limits = getPlanLimits(plan);
    const usage = await getUsage(user.id);

    if (usage.messagesToday >= limits.messagesDaily) {
      const { pathname } = new URL(req.url);
      const resetAt = new Date(new Date().setUTCHours(24,0,0,0)).toISOString();
      const log = makeReqLogger({ requestId, userId: user.id, route: pathname, method: req.method });
      log.warn('ai_chat_rate_limited', {
        plan,
        code: 'daily_message_limit_reached',
        limit: limits.messagesDaily,
        resetAt,
      });
      const res = NextResponse.json({ code: 'daily_message_limit_reached', limit: limits.messagesDaily, resetAt, requestId }, { status: 429 });
      res.headers.set('X-Request-Id', requestId);
      return res;
    }
    if (usage.tokensMonth >= limits.tokensMonthly) {
      const { pathname } = new URL(req.url);
      // reset at end of month UTC
      const d = new Date();
      const resetAt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 1, 0, 0, 0, 0)).toISOString();
      const log = makeReqLogger({ requestId, userId: user.id, route: pathname, method: req.method });
      log.warn('ai_chat_rate_limited', {
        plan,
        code: 'monthly_token_limit_reached',
        limit: limits.tokensMonthly,
        resetAt,
      });
      const res = NextResponse.json({ code: 'monthly_token_limit_reached', limit: limits.tokensMonthly, resetAt, requestId }, { status: 429 });
      res.headers.set('X-Request-Id', requestId);
      return res;
    }

    // Warn if client attempted to pass plan in body (spoof attempt)
    if ((json as any).plan) {
      const { pathname } = new URL(req.url);
      const log = makeReqLogger({ requestId, userId: user.id, route: pathname, method: req.method });
      log.warn('plan_spoof_attempt', { provided: (json as any).plan });
    }

    const premium = needsPremium(messages as ChatMessage[], plan);
    const deployment = premium && DEPLOY_4O ? DEPLOY_4O : (DEPLOY_4OMINI || DEPLOY_4O);
    if (!deployment) {
      const err = NextResponse.json({ error: 'azure_deployments_not_configured', requestId }, { status: 500 });
      err.headers.set('X-Request-Id', requestId);
      return err;
    }

    const inputText = messages.map(m => m.content).join('\n');
    const estIn = estimateTokens(inputText);
    const { text } = await chatWith(messages as ChatMessage[], { deployment, temperature });
    const estOut = estimateTokens(text);

    await incrementUsage(user.id, estIn, estOut);

    // Structured log
    const { pathname } = new URL(req.url);
    const log = makeReqLogger({ requestId, userId: user.id, route: pathname, method: req.method });
    if (sample(0.05)) {
      log.info('ai_chat_completed', {
        plan,
        premiumRouted: premium,
        model: deployment,
        inputTokens: estIn,
        outputTokens: estOut,
      });
    }

    const res = NextResponse.json({ requestId, text, model: deployment, premiumRouted: premium, plan, usage: { estIn, estOut } }, { status: 200 });
    res.headers.set('X-Request-Id', requestId);
    return res;
  } catch (e: any) {
    const msg = e?.status ? e.message : (e?.message || 'router_failed');
    const err = NextResponse.json({ error: msg, requestId }, { status: e?.status || 500 });
    err.headers.set('X-Request-Id', requestId);
    return err;
  }
}
