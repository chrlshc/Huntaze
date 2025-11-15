/**
 * Build-Safe OpenAI Configuration
 * 
 * Provides safe OpenAI client initialization that doesn't fail during build
 * This module can be imported safely without causing build errors
 */

// Check if we're in build mode
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// Mock OpenAI client for build time
const mockOpenAI = {
  chat: {
    completions: {
      create: async () => {
        throw new Error('OpenAI not available during build');
      }
    }
  }
};

// Lazy OpenAI import and initialization
let OpenAIClass: any = null;
let openaiClient: any = null;

/**
 * Get OpenAI class safely (lazy import)
 */
function getOpenAIClass() {
  if (OpenAIClass) return OpenAIClass;
  
  if (isBuildTime) {
    return null;
  }
  
  try {
    // Dynamic require to avoid build-time evaluation
    const openaiModule = require('openai');
    OpenAIClass = openaiModule.default || openaiModule.OpenAI || openaiModule;
    return OpenAIClass;
  } catch (error) {
    console.error('Failed to load OpenAI module:', error);
    return null;
  }
}

/**
 * Get OpenAI client safely
 * Returns mock during build, real client at runtime
 */
export function getOpenAIClient() {
  // Return existing client if available
  if (openaiClient) return openaiClient;
  
  // Return mock during build
  if (isBuildTime) {
    openaiClient = mockOpenAI;
    return mockOpenAI as any;
  }
  
  // Get API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder_for_build') {
    console.warn('OpenAI API key not configured - using mock');
    openaiClient = mockOpenAI;
    return mockOpenAI as any;
  }
  
  // Get OpenAI class
  const OpenAI = getOpenAIClass();
  if (!OpenAI) {
    console.warn('OpenAI module not available - using mock');
    openaiClient = mockOpenAI;
    return mockOpenAI as any;
  }
  
  // Create real client
  try {
    openaiClient = new OpenAI({ apiKey });
    return openaiClient;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    openaiClient = mockOpenAI;
    return mockOpenAI as any;
  }
}

/**
 * Check if OpenAI is available
 */
export function isOpenAIAvailable(): boolean {
  if (isBuildTime) return false;
  
  const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  return !!(apiKey && apiKey !== 'placeholder_for_build');
}

/**
 * Reset OpenAI client (useful for testing)
 */
export function resetOpenAIClient() {
  openaiClient = null;
  OpenAIClass = null;
}
