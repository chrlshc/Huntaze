// Environment configurations for load tests

export const ENVIRONMENTS = {
  local: {
    baseUrl: 'http://localhost:3000',
    description: 'Local development environment',
    maxVus: 100,  // Limited for local testing
  },
  
  staging: {
    baseUrl: 'https://staging.huntaze.com',
    description: 'Staging environment',
    maxVus: 1000,
  },
  
  production: {
    baseUrl: 'https://huntaze.com',
    description: 'Production environment',
    maxVus: 5000,
    // Production tests should be run carefully
    requiresApproval: true,
  },
};

// Get environment configuration
export function getEnvironment(envName = 'local') {
  const env = ENVIRONMENTS[envName];
  
  if (!env) {
    console.warn(`Unknown environment: ${envName}, using local`);
    return ENVIRONMENTS.local;
  }
  
  return env;
}

// Get base URL from environment variable or default
export function getBaseUrl() {
  return __ENV.BASE_URL || ENVIRONMENTS.local.baseUrl;
}

// Check if environment requires approval
export function requiresApproval(envName) {
  const env = getEnvironment(envName);
  return env.requiresApproval || false;
}

// Get max VUs for environment
export function getMaxVus(envName) {
  const env = getEnvironment(envName);
  return env.maxVus || 100;
}

// Export current environment info
export function getCurrentEnvironment() {
  const baseUrl = getBaseUrl();
  
  // Determine environment from URL
  if (baseUrl.includes('localhost')) {
    return { ...ENVIRONMENTS.local, baseUrl };
  } else if (baseUrl.includes('staging')) {
    return { ...ENVIRONMENTS.staging, baseUrl };
  } else if (baseUrl.includes('huntaze.com')) {
    return { ...ENVIRONMENTS.production, baseUrl };
  }
  
  return {
    baseUrl,
    description: 'Custom environment',
    maxVus: 1000,
  };
}
