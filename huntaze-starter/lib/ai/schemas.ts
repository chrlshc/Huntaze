// lib/ai/schemas.ts
export const SmartRepliesSchema = {
  name: 'smart_replies',
  value: {
    type: 'object',
    additionalProperties: false,
    properties: {
      replies: {
        type: 'object',
        additionalProperties: false,
        properties: {
          friendly: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: { type: 'string', description: 'Short, plain-English reply.' },
              policy_tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['text', 'policy_tags']
          },
          direct: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: { type: 'string' },
              policy_tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['text', 'policy_tags']
          },
          upsell: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: { type: 'string', description: 'Brief, value-forward reply. Avoid hype.' },
              policy_tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['text', 'policy_tags']
          }
        },
        required: ['friendly', 'direct', 'upsell']
      }
    },
    required: ['replies']
  }
} as const

