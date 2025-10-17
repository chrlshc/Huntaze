import type { ChatMessage } from './azure';

const PREMIUM_KEYWORDS = [
  'payment', 'pay', 'buy', 'price', 'pricing', 'subscribe', 'subscription',
  'refund', 'complaint', 'angry', 'escalate', 'cancel', 'checkout', 'offer', 'discount',
  'urgent', 'vip', 'whale', 'high value', 'upsell'
];

export function needsPremium(messages: ChatMessage[], plan: 'starter'|'pro'|'scale'): boolean {
  const last = messages[messages.length - 1]?.content || '';
  const len = (last || '').length;
  const lower = last.toLowerCase();
  const hasKeyword = PREMIUM_KEYWORDS.some(k => lower.includes(k));
  // Length thresholds per plan (more strict on higher plans)
  const lenThresh = plan === 'scale' ? 400 : plan === 'pro' ? 300 : 250;
  return hasKeyword || len > lenThresh;
}

export function estimateTokens(text: string): number {
  // Rough heuristic: ~4 chars per token
  return Math.ceil((text || '').length / 4);
}

