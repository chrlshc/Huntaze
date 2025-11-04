/**
 * Configuration constants for AWS Amplify Environment Variables Management
 */

// Required environment variables for Huntaze application
export const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_VERSION',
  'AZURE_OPENAI_DEPLOYMENT'
] as const;

// Optional environment variables
export const OPTIONAL_VARIABLES = [
  'AWS_REGION',
  'FROM_EMAIL',
  'NEXT_PUBLIC_APP_URL',
  'TOKEN_ENCRYPTION_KEY'
] as const;

// Sensitive variable patterns
export const SENSITIVE_PATTERNS = [
  /.*SECRET.*/i,
  /.*KEY.*/i,
  /.*PASSWORD.*/i,
  /.*TOKEN.*/i,
  /.*CREDENTIAL.*/i,
  /.*AUTH.*/i,
  /DATABASE_URL/i,
  /.*API_KEY.*/i,
  /.*PRIVATE.*/i
] as const;

// Environment-specific variables that should not be synced between environments
export const ENVIRONMENT_SPECIFIC_VARIABLES = [
  'NEXT_PUBLIC_APP_URL',
  'APP_URL',
  'FRONTEND_URL',
  'BACKEND_URL',
  'API_BASE_URL'
] as const;

// Default values for staging environment
export const STAGING_DEFAULTS = {
  NODE_ENV: 'production',
  AWS_REGION: 'us-east-1',
  FROM_EMAIL: 'noreply@huntaze.com',
  NEXT_PUBLIC_APP_URL: 'https://staging.huntaze.com'
} as const;

// Default values for production environment
export const PRODUCTION_DEFAULTS = {
  NODE_ENV: 'production',
  AWS_REGION: 'us-east-1',
  FROM_EMAIL: 'noreply@huntaze.com',
  NEXT_PUBLIC_APP_URL: 'https://huntaze.com'
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  DATABASE_URL: /^postgresql:\/\/[^:]+:[^@]+@[^:]+:[0-9]+\/[^?]+\?schema=\w+$/,
  JWT_SECRET: /^.{32,}$/,
  NODE_ENV: /^(development|staging|production)$/,
  AZURE_OPENAI_API_KEY: /^[A-Za-z0-9]{64}$/,
  AZURE_OPENAI_ENDPOINT: /^https:\/\/[a-zA-Z0-9-]+\.openai\.azure\.com$/,
  AZURE_OPENAI_API_VERSION: /^\d{4}-\d{2}-\d{2}(-preview)?$/,
  AZURE_OPENAI_DEPLOYMENT: /^[a-zA-Z0-9-]+$/,
  AWS_REGION: /^[a-z]{2}-[a-z]+-\d{1}$/,
  FROM_EMAIL: /^[^@]+@[^@]+\.[^@]+$/,
  NEXT_PUBLIC_APP_URL: /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  TOKEN_ENCRYPTION_KEY: /^[A-Za-z0-9+/]{43}=$/
} as const;

// AWS Amplify configuration
export const AWS_CONFIG = {
  REGION: 'us-east-1',
  API_VERSION: '2017-07-25',
  MAX_RETRIES: 3,
  RETRY_DELAY: 300,
  CONNECTION_TIMEOUT: 60000,
  SOCKET_TIMEOUT: 60000
} as const;

// CLI configuration
export const CLI_CONFIG = {
  OUTPUT_FORMAT: 'json',
  MAX_VARIABLE_NAME_LENGTH: 255,
  MAX_VARIABLE_VALUE_LENGTH: 5500,
  BATCH_SIZE: 50
} as const;

// Monitoring configuration
export const MONITORING_CONFIG = {
  HEALTH_CHECK_INTERVAL: 300000, // 5 minutes
  ALERT_THRESHOLDS: {
    VALIDATION_FAILURE_RATE: 0.1,
    BUILD_FAILURE_RATE: 0.2,
    CONNECTIVITY_FAILURE_RATE: 0.05
  },
  RETENTION_PERIODS: {
    LOGS: '30d',
    METRICS: '90d',
    BACKUPS: '1y'
  }
} as const;

// Error codes
export const ERROR_CODES = {
  CONFIGURATION_ERROR: 'CONF_ERR',
  SECURITY_ERROR: 'SEC_ERR',
  SYNC_ERROR: 'SYNC_ERR',
  AWS_CLI_ERROR: 'AWS_CLI_ERR',
  VALIDATION_ERROR: 'VAL_ERR',
  NETWORK_ERROR: 'NET_ERR',
  PERMISSION_ERROR: 'PERM_ERR'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  VARIABLES_SET: 'Environment variables successfully set',
  VARIABLES_VALIDATED: 'All environment variables validated successfully',
  ENVIRONMENTS_SYNCED: 'Environments synchronized successfully',
  BACKUP_CREATED: 'Backup created successfully',
  CONFIGURATION_APPLIED: 'Configuration applied successfully'
} as const;

// Detailed validation rules for environment variables
export const VALIDATION_RULES: Record<string, {
  required?: boolean;
  format?: string;
  minLength?: number;
  maxLength?: number;
  description?: string;
  pattern?: RegExp;
}> = {
  // Database configuration
  'DATABASE_URL': {
    required: true,
    format: 'database_url',
    pattern: VALIDATION_PATTERNS.DATABASE_URL,
    description: 'PostgreSQL connection string with schema'
  },
  
  // JWT configuration
  'JWT_SECRET': {
    required: true,
    format: 'jwt_secret',
    minLength: 32,
    pattern: VALIDATION_PATTERNS.JWT_SECRET,
    description: 'JWT signing secret (minimum 32 characters)'
  },

  // Node environment
  'NODE_ENV': {
    required: true,
    pattern: VALIDATION_PATTERNS.NODE_ENV,
    description: 'Node.js environment (development, staging, production)'
  },

  // Azure OpenAI configuration
  'AZURE_OPENAI_API_KEY': {
    required: true,
    format: 'azure_openai',
    minLength: 64,
    maxLength: 64,
    pattern: VALIDATION_PATTERNS.AZURE_OPENAI_API_KEY,
    description: 'Azure OpenAI API key (64 characters)'
  },
  'AZURE_OPENAI_ENDPOINT': {
    required: true,
    format: 'azure_openai',
    pattern: VALIDATION_PATTERNS.AZURE_OPENAI_ENDPOINT,
    description: 'Azure OpenAI service endpoint URL'
  },
  'AZURE_OPENAI_API_VERSION': {
    required: true,
    pattern: VALIDATION_PATTERNS.AZURE_OPENAI_API_VERSION,
    description: 'Azure OpenAI API version (YYYY-MM-DD format)'
  },
  'AZURE_OPENAI_DEPLOYMENT': {
    required: true,
    format: 'azure_openai',
    pattern: VALIDATION_PATTERNS.AZURE_OPENAI_DEPLOYMENT,
    description: 'Azure OpenAI deployment name'
  },

  // AWS configuration
  'AWS_REGION': {
    required: false,
    pattern: VALIDATION_PATTERNS.AWS_REGION,
    description: 'AWS region identifier'
  },

  // Email configuration
  'FROM_EMAIL': {
    required: false,
    format: 'email',
    pattern: VALIDATION_PATTERNS.FROM_EMAIL,
    description: 'Default sender email address'
  },

  // Application URLs
  'NEXT_PUBLIC_APP_URL': {
    required: false,
    format: 'url',
    pattern: VALIDATION_PATTERNS.NEXT_PUBLIC_APP_URL,
    description: 'Public application URL'
  },

  // Token encryption
  'TOKEN_ENCRYPTION_KEY': {
    required: false,
    format: 'base64',
    minLength: 44,
    maxLength: 44,
    pattern: VALIDATION_PATTERNS.TOKEN_ENCRYPTION_KEY,
    description: 'Base64 encoded token encryption key'
  },

  // Additional common variables
  'DATABASE_HOST': {
    required: false,
    description: 'Database host address'
  },
  'DATABASE_PORT': {
    required: false,
    minLength: 1,
    maxLength: 5,
    description: 'Database port number'
  },
  'DATABASE_NAME': {
    required: false,
    minLength: 1,
    maxLength: 63,
    description: 'Database name'
  },
  'DATABASE_USER': {
    required: false,
    minLength: 1,
    maxLength: 63,
    description: 'Database username'
  },
  'DATABASE_PASSWORD': {
    required: false,
    minLength: 8,
    description: 'Database password'
  },

  // NextAuth configuration
  'NEXTAUTH_URL': {
    required: false,
    format: 'url',
    description: 'NextAuth.js canonical URL'
  },
  'NEXTAUTH_SECRET': {
    required: false,
    format: 'jwt_secret',
    minLength: 32,
    description: 'NextAuth.js encryption secret'
  },

  // Social OAuth configuration
  'GOOGLE_CLIENT_ID': {
    required: false,
    description: 'Google OAuth client ID'
  },
  'GOOGLE_CLIENT_SECRET': {
    required: false,
    description: 'Google OAuth client secret'
  },
  'GITHUB_CLIENT_ID': {
    required: false,
    description: 'GitHub OAuth client ID'
  },
  'GITHUB_CLIENT_SECRET': {
    required: false,
    description: 'GitHub OAuth client secret'
  },

  // Redis configuration
  'REDIS_URL': {
    required: false,
    format: 'url',
    description: 'Redis connection URL'
  },

  // Application configuration
  'PORT': {
    required: false,
    description: 'Application port'
  },
  'APP_URL': {
    required: false,
    format: 'url',
    description: 'Application base URL'
  },
  'API_URL': {
    required: false,
    format: 'url',
    description: 'API base URL'
  }
} as const;

// File paths
export const FILE_PATHS = {
  VALIDATION_RULES: 'config/amplify-env-vars/validation-rules.json',
  SENSITIVE_PATTERNS: 'config/amplify-env-vars/sensitive-patterns.json',
  AWS_CONFIG: 'config/amplify-env-vars/aws-config.json',
  STAGING_TEMPLATE: 'config/amplify-env-vars/staging-template.yaml',
  PRODUCTION_TEMPLATE: 'config/amplify-env-vars/production-template.yaml'
} as const;