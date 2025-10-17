import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  ENABLE_CIN_AI: z.enum(['true', 'false']).default('false'),
  LLM_PROVIDER: z.enum(['mock', 'openai', 'azure']).default('mock'),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-10-01-preview'),
  AZURE_OPENAI_API_KEY: z.string().optional(),

  POWERTOOLS_SERVICE_NAME: z.string().default('cin'),
  POWERTOOLS_METRICS_NAMESPACE: z.string().default('CIN'),
})
  .superRefine((env, ctx) => {
    if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when LLM_PROVIDER=openai',
      })
    }
    if (
      env.LLM_PROVIDER === 'azure' &&
      (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_DEPLOYMENT) &&
      !env.AZURE_OPENAI_API_KEY
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AZURE_OPENAI_ENDPOINT'],
        message: 'Azure OpenAI requires endpoint, deployment, and either Managed Identity or API key',
      })
    }
  })

export type Env = z.infer<typeof EnvSchema>
export const env: Env = EnvSchema.parse(process.env)
