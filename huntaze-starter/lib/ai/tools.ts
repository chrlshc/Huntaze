// lib/ai/tools.ts
export const CIN_TOOLS = [
  {
    type: 'function',
    name: 'schedule_post',
    description: 'Schedule a post for a given channel and time (UTC).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        channel: { type: 'string', enum: ['tiktok', 'reddit', 'instagram'] },
        when_iso: { type: 'string', description: 'ISO 8601 timestamp in UTC' }
      },
      required: ['channel', 'when_iso']
    }
  },
  {
    type: 'function',
    name: 'create_ab_test',
    description: 'Create an A/B test with two variants and a target segment.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        variant_a: { type: 'string' },
        variant_b: { type: 'string' },
        segment: { type: 'string' }
      },
      required: ['variant_a', 'variant_b', 'segment']
    }
  },
  {
    type: 'function',
    name: 'update_pricing',
    description: 'Propose a pricing change for a product or plan.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        plan: { type: 'string' },
        price_usd: { type: 'number' }
      },
      required: ['plan', 'price_usd']
    }
  },
  {
    type: 'function',
    name: 'mark_vip',
    description: 'Mark a user as VIP with a reason.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        user_id: { type: 'string' },
        reason: { type: 'string' }
      },
      required: ['user_id', 'reason']
    }
  }
] as const

