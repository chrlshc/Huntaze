/**
 * Azure OpenAI Configuration
 * Manages Azure OpenAI Service deployments and settings
 */

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey?: string;
  useManagedIdentity: boolean;
  deployments: {
    premium: string;
    standard: string;
    economy: string;
    vision: string;
    embedding: string;
  };
  timeout: number;
  retryConfig: RetryConfig;
  regions: {
    primary: string;
    secondary: string;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export const AZURE_OPENAI_CONFIG: AzureOpenAIConfig = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://huntaze-ai-eastus.openai.azure.com/',
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  useManagedIdentity: process.env.AZURE_USE_MANAGED_IDENTITY === 'true',
  
  deployments: {
    premium: 'gpt-4-turbo-prod',
    standard: 'gpt-4-standard-prod',
    economy: 'gpt-35-turbo-prod',
    vision: 'gpt-4-vision-prod',
    embedding: 'text-embedding-ada-002-prod',
  },
  
  timeout: 30000, // 30 seconds
  
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffFactor: 2,
  },
  
  regions: {
    primary: 'eastus',
    secondary: 'eastus', // Single region deployment
  },
};

export const AZURE_OPENAI_MODELS = {
  'gpt-4-turbo-prod': {
    name: 'gpt-4-turbo',
    version: '2024-04-09',
    maxTokens: 128000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  'gpt-4-standard-prod': {
    name: 'gpt-4',
    version: '0613',
    maxTokens: 8192,
    costPer1kInput: 0.03,
    costPer1kOutput: 0.06,
  },
  'gpt-35-turbo-prod': {
    name: 'gpt-3.5-turbo',
    version: '0125',
    maxTokens: 16385,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
  },
  'gpt-4-vision-prod': {
    name: 'gpt-4-vision',
    version: '2024-02-15',
    maxTokens: 128000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  'text-embedding-ada-002-prod': {
    name: 'text-embedding-ada-002',
    version: '2',
    dimensions: 1536,
    costPer1kTokens: 0.0001,
  },
} as const;

export type AzureDeployment = keyof typeof AZURE_OPENAI_MODELS;
