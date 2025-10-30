/**
 * Adaptive Timeout Integration Examples
 * Demonstrates real-world usage patterns
 */

import {
  createAdaptiveCircuitBreaker,
  createTimeoutCalculator,
  type TimeoutConfig,
  type Logger,
  CircuitBreakerOpenError,
  TimeoutExceededError
} from '@/lib/services/adaptive-timeout-gpt5';

// ============================================================================
// EXAMPLE 1: Basic GPT-5 API Integration
// ============================================================================

export async function basicGPT5Integration() {
  const breaker = createAdaptiveCircuitBreaker();
  
  const prompt = "Explain quantum computing in simple terms";
  const tokenCount = estimateTokens(prompt);
  
  try {
    const result = await breaker.execute(
      async () => {
        // Your GPT-5 API call
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-5',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      },
      {
        model: 'gpt-5',
        reasoningEffort: 'medium',
        tokenCount,
        systemLoad: getCurrentSystemLoad()
      },
      {
        enableRetry: true,
        requestId: generateRequestId(),
        userId: 'user-123'
      }
    );
    
    console.log('GPT-5 Response:', result.choices[0].message.content);
    return result;
    
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      console.error('Service temporarily unavailable');
      // Show user-friendly message
      return { error: 'Service is experiencing high load. Please try again later.' };
    } else if (error instanceof TimeoutExceededError) {
      console.error('Request timed out');
      return { error: 'Request took too long. Please try a simpler query.' };
    }
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Batch Processing with Adaptive Timeout
// ============================================================================

export async function batchProcessing(prompts: string[]) {
  const breaker = createAdaptiveCircuitBreaker();
  const results = [];
  
  for (const prompt of prompts) {
    const tokenCount = estimateTokens(prompt);
    const reasoningEffort = determineReasoningEffort(prompt);
    
    try {
      const result = await breaker.execute(
        async () => await callGPT5API(prompt),
        {
          model: 'gpt-5',
          reasoningEffort,
          tokenCount,
          systemLoad: getCurrentSystemLoad()
        },
        {
          enableRetry: true,
          requestId: generateRequestId()
        }
      );
      
      results.push({ prompt, result, success: true });
      
    } catch (error) {
      console.error(`Failed to process prompt: ${prompt}`, error);
      results.push({ prompt, error: (error as Error).message, success: false });
      
      // If circuit breaker opens, stop processing
      if (error instanceof CircuitBreakerOpenError) {
        console.log('Circuit breaker opened, stopping batch processing');
        break;
      }
    }
    
    // Add delay between requests to avoid rate limiting
    await sleep(1000);
  }
  
  return results;
}

// ============================================================================
// EXAMPLE 3: Streaming with Adaptive Timeout
// ============================================================================

export async function streamingWithTimeout(prompt: string) {
  const breaker = createAdaptiveCircuitBreaker();
  const tokenCount = estimateTokens(prompt);
  
  const stream = await breaker.execute(
    async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-5',
          messages: [{ role: 'user', content: prompt }],
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.body;
    },
    {
      model: 'gpt-5',
      reasoningEffort: 'high',
      tokenCount,
      systemLoad: getCurrentSystemLoad()
    },
    {
      enableRetry: false, // Don't retry streaming requests
      requestId: generateRequestId()
    }
  );
  
  // Process stream
  const reader = stream?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    console.log('Stream chunk:', chunk);
    // Process chunk...
  }
}

// ============================================================================
// EXAMPLE 4: Multi-Model Strategy
// ============================================================================

export async function multiModelStrategy(prompt: string) {
  const breaker = createAdaptiveCircuitBreaker();
  const tokenCount = estimateTokens(prompt);
  const systemLoad = getCurrentSystemLoad();
  
  // Try GPT-5 first
  try {
    return await breaker.execute(
      async () => await callGPT5API(prompt, 'gpt-5'),
      {
        model: 'gpt-5',
        reasoningEffort: 'high',
        tokenCount,
        systemLoad
      },
      { enableRetry: true, requestId: generateRequestId() }
    );
  } catch (error) {
    console.warn('GPT-5 failed, falling back to GPT-5-mini');
    
    // Fallback to GPT-5-mini
    try {
      return await breaker.execute(
        async () => await callGPT5API(prompt, 'gpt-5-mini'),
        {
          model: 'gpt-5-mini',
          reasoningEffort: 'medium',
          tokenCount,
          systemLoad
        },
        { enableRetry: true, requestId: generateRequestId() }
      );
    } catch (miniError) {
      console.warn('GPT-5-mini failed, falling back to GPT-5-nano');
      
      // Final fallback to GPT-5-nano
      return await breaker.execute(
        async () => await callGPT5API(prompt, 'gpt-5-nano'),
        {
          model: 'gpt-5-nano',
          reasoningEffort: 'minimal',
          tokenCount,
          systemLoad
        },
        { enableRetry: true, requestId: generateRequestId() }
      );
    }
  }
}

// ============================================================================
// EXAMPLE 5: Health Monitoring Dashboard
// ============================================================================

export function setupHealthMonitoring(breaker: ReturnType<typeof createAdaptiveCircuitBreaker>) {
  // Check health every minute
  setInterval(() => {
    const circuitHealth = breaker.getHealthMetrics();
    const calculatorHealth = breaker.getCalculator().getHealthMetrics();
    
    console.log('=== Adaptive Timeout Health ===');
    console.log('Circuit Breaker:', {
      state: circuitHealth.state,
      isHealthy: circuitHealth.isHealthy,
      failures: circuitHealth.failureCount,
      successes: circuitHealth.successCount
    });
    
    console.log('System Load:', calculatorHealth.currentLoad);
    console.log('Buckets:', Object.keys(calculatorHealth.buckets).length);
    
    // Alert if unhealthy
    if (!circuitHealth.isHealthy) {
      alertOpsTeam('Circuit breaker unhealthy', circuitHealth);
    }
    
    // Alert if high load
    if (calculatorHealth.currentLoad > 0.8) {
      alertOpsTeam('High system load', { load: calculatorHealth.currentLoad });
    }
  }, 60000);
}

// ============================================================================
// EXAMPLE 6: Custom Logger Integration
// ============================================================================

export function createWithCustomLogger() {
  // Winston logger example
  const winston = require('winston');
  
  const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  
  const customLogger: Logger = {
    debug: (msg, meta) => winstonLogger.debug(msg, meta),
    info: (msg, meta) => winstonLogger.info(msg, meta),
    warn: (msg, meta) => winstonLogger.warn(msg, meta),
    error: (msg, err, meta) => winstonLogger.error(msg, { error: err, ...meta })
  };
  
  return createAdaptiveCircuitBreaker(customLogger);
}

// ============================================================================
// EXAMPLE 7: Metrics Export for Prometheus
// ============================================================================

export function setupPrometheusMetrics(breaker: ReturnType<typeof createAdaptiveCircuitBreaker>) {
  const calculator = breaker.getCalculator();
  
  // Listen to events
  calculator.on('timeout-calculated', (data) => {
    // Export to Prometheus
    prometheusMetrics.timeoutCalculated.inc({
      model: data.model,
      reasoning_effort: data.reasoningEffort,
      confidence: data.confidence
    });
    
    prometheusMetrics.timeoutValue.set(
      { model: data.model, reasoning_effort: data.reasoningEffort },
      data.timeout
    );
  });
  
  calculator.on('latency-recorded', (metric) => {
    prometheusMetrics.requestLatency.observe(
      {
        model: metric.model,
        reasoning_effort: metric.reasoningEffort || 'unknown',
        success: metric.success.toString()
      },
      metric.latency
    );
  });
}

// ============================================================================
// EXAMPLE 8: A/B Testing Different Timeout Strategies
// ============================================================================

export async function abTestTimeoutStrategies(prompt: string) {
  const variant = Math.random() < 0.5 ? 'A' : 'B';
  const breaker = createAdaptiveCircuitBreaker();
  const tokenCount = estimateTokens(prompt);
  
  const config: TimeoutConfig = {
    model: 'gpt-5',
    reasoningEffort: variant === 'A' ? 'high' : 'medium',
    tokenCount,
    systemLoad: getCurrentSystemLoad()
  };
  
  const startTime = Date.now();
  
  try {
    const result = await breaker.execute(
      async () => await callGPT5API(prompt),
      config,
      {
        enableRetry: variant === 'A', // Only retry for variant A
        requestId: generateRequestId()
      }
    );
    
    const duration = Date.now() - startTime;
    
    // Track A/B test metrics
    trackABTest({
      variant,
      success: true,
      duration,
      tokenCount,
      reasoningEffort: config.reasoningEffort
    });
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    trackABTest({
      variant,
      success: false,
      duration,
      tokenCount,
      error: (error as Error).message
    });
    
    throw error;
  }
}

// ============================================================================
// EXAMPLE 9: Rate Limiting Integration
// ============================================================================

export async function withRateLimiting(prompt: string) {
  const breaker = createAdaptiveCircuitBreaker();
  const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });
  
  // Check rate limit first
  if (!await rateLimiter.checkLimit('user-123')) {
    throw new Error('Rate limit exceeded');
  }
  
  const tokenCount = estimateTokens(prompt);
  
  return await breaker.execute(
    async () => await callGPT5API(prompt),
    {
      model: 'gpt-5',
      reasoningEffort: 'medium',
      tokenCount,
      systemLoad: getCurrentSystemLoad()
    },
    {
      enableRetry: true,
      requestId: generateRequestId(),
      userId: 'user-123'
    }
  );
}

// ============================================================================
// EXAMPLE 10: Caching Integration
// ============================================================================

export async function withCaching(prompt: string) {
  const breaker = createAdaptiveCircuitBreaker();
  const cacheKey = `gpt5:${hashPrompt(prompt)}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Cache hit');
    return JSON.parse(cached);
  }
  
  // Execute with adaptive timeout
  const result = await breaker.execute(
    async () => await callGPT5API(prompt),
    {
      model: 'gpt-5',
      reasoningEffort: 'medium',
      tokenCount: estimateTokens(prompt),
      systemLoad: getCurrentSystemLoad()
    },
    {
      enableRetry: true,
      requestId: generateRequestId()
    }
  );
  
  // Cache result
  await redis.setex(cacheKey, 3600, JSON.stringify(result));
  
  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function estimateTokens(text: string): number {
  // Simple estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function determineReasoningEffort(prompt: string): 'high' | 'medium' | 'minimal' {
  const complexKeywords = ['analyze', 'explain', 'compare', 'evaluate', 'reason'];
  const simpleKeywords = ['list', 'name', 'what is', 'define'];
  
  const lowerPrompt = prompt.toLowerCase();
  
  if (complexKeywords.some(kw => lowerPrompt.includes(kw))) {
    return 'high';
  } else if (simpleKeywords.some(kw => lowerPrompt.includes(kw))) {
    return 'minimal';
  }
  
  return 'medium';
}

function getCurrentSystemLoad(): number {
  // Mock implementation - replace with actual monitoring
  return Math.random() * 0.8; // 0-80% load
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function callGPT5API(prompt: string, model: string = 'gpt-5'): Promise<any> {
  // Mock implementation - replace with actual API call
  return { response: `Response from ${model}`, tokens: estimateTokens(prompt) };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function alertOpsTeam(message: string, data: any): void {
  console.error('[ALERT]', message, data);
  // Integrate with PagerDuty, Slack, etc.
}

function trackABTest(data: any): void {
  console.log('[A/B Test]', data);
  // Send to analytics platform
}

function createRateLimiter(config: any): any {
  // Mock implementation
  return {
    checkLimit: async (userId: string) => true
  };
}

function hashPrompt(prompt: string): string {
  // Simple hash - use crypto.createHash in production
  return Buffer.from(prompt).toString('base64').substr(0, 32);
}

const redis = {
  get: async (key: string) => null,
  setex: async (key: string, ttl: number, value: string) => {}
};

const prometheusMetrics = {
  timeoutCalculated: { inc: (labels: any) => {} },
  timeoutValue: { set: (labels: any, value: number) => {} },
  requestLatency: { observe: (labels: any, value: number) => {} }
};
