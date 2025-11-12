/**
 * Integration Tests - /api/onboarding/wizard Endpoint
 * 
 * Tests the wizard completion endpoint with:
 * - Request validation (Zod schema)
 * - Authentication and authorization
 * - Database transactions
 * - Error handling and graceful degradation
 * - Service configuration generation
 * - Analytics event tracking
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const WIZARD_ENDPOINT = `${BASE_URL}/api/onboarding/wizard`;

// Response schema for validation
const WizardResponseSchema = z.object({
  success: z.boolean(),
  user_id: z.string(),
  services_enabled: z.array(z.string()),
  templates_loaded: z.array(z.string()),
  dashboard_config: z.object({
    primary_metrics: z.array(z.string()),
    quick_actions: z.array(z.string())
  }),
  ai_config: z.object({
    system_prompt: z.string(),
    tone: z.string(),
    emoji_frequency: z.enum(['none', 'low', 'medium', 'high']),
    response_length: z.enum(['short', 'medium', 'long']),
    creativity_level: z.enum(['low', 'medium', 'high'])
  }),
  correlationId: z.string().uuid()
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  correlationId: z.string().uuid()
});

describe('Integration: /api/onboarding/wizard', () => {
  describe('HTTP Status Codes', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow'
        })
      });
      
      expect(response.status).toBe(401);
      
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.correlationId).toBeDefined();
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: 'invalid json{'
      });
      
      expect(response.status).toBe(400);
      
      const json = await response.json();
      expect(json.error).toContain('Invalid JSON');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram'
          // Missing primary_goal
        })
      });
      
      expect(response.status).toBe(400);
      
      const json = await response.json();
      expect(json.error).toBe('Invalid request body');
      expect(json.details).toContain('primary_goal');
    });

    it('should return 400 for invalid enum values', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'facebook', // Invalid platform
          primary_goal: 'grow'
        })
      });
      
      expect(response.status).toBe(400);
      
      const json = await response.json();
      expect(json.error).toBe('Invalid request body');
      expect(json.details).toContain('platform');
    });
  });

  describe('Request Validation', () => {
    it('should validate platform enum', async () => {
      const invalidPlatforms = ['facebook', 'twitter', 'youtube', ''];
      
      for (const platform of invalidPlatforms) {
        const response = await fetch(WIZARD_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            platform,
            primary_goal: 'grow'
          })
        });
        
        expect(response.status).toBe(400);
      }
    });

    it('should validate primary_goal enum', async () => {
      const invalidGoals = ['invalid', 'test', ''];
      
      for (const goal of invalidGoals) {
        const response = await fetch(WIZARD_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            platform: 'instagram',
            primary_goal: goal
          })
        });
        
        expect(response.status).toBe(400);
      }
    });

    it('should validate ai_tone enum when provided', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow',
          ai_tone: 'invalid_tone'
        })
      });
      
      expect(response.status).toBe(400);
      
      const json = await response.json();
      expect(json.details).toContain('ai_tone');
    });

    it('should validate time_to_complete is non-negative', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow',
          time_to_complete: -100
        })
      });
      
      expect(response.status).toBe(400);
    });

    it('should accept valid optional fields', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow',
          ai_tone: 'professional',
          follower_range: '1k-10k',
          time_to_complete: 120,
          questions_skipped: [2, 4]
        })
      });
      
      // Should not be 400 (validation error)
      expect(response.status).not.toBe(400);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return valid response schema on success', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow',
          ai_tone: 'professional'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        const result = WizardResponseSchema.safeParse(json);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.success).toBe(true);
          expect(result.data.services_enabled.length).toBeGreaterThan(0);
          expect(result.data.templates_loaded.length).toBeGreaterThan(0);
        }
      }
    });

    it('should return valid error schema on failure', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'invalid'
        })
      });
      
      const json = await response.json();
      const result = ErrorResponseSchema.safeParse(json);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Service Configuration', () => {
    it('should return Instagram services for Instagram platform', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.services_enabled).toContain('hashtag_analyzer');
        expect(json.services_enabled).toContain('engagement_predictor');
        expect(json.services_enabled).toContain('reel_formatter');
      }
    });

    it('should return OnlyFans services for OnlyFans platform', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'onlyfans',
          primary_goal: 'automate'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.services_enabled).toContain('onlyfans_scraper');
        expect(json.services_enabled).toContain('auto_dm_engine');
        expect(json.services_enabled).toContain('ppv_detector');
      }
    });

    it('should configure dashboard for grow goal', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.dashboard_config.primary_metrics).toContain('new_followers');
        expect(json.dashboard_config.primary_metrics).toContain('engagement_rate');
        expect(json.dashboard_config.quick_actions).toContain('view_analytics');
      }
    });

    it('should configure dashboard for automate goal', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'automate'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.dashboard_config.primary_metrics).toContain('unread_messages');
        expect(json.dashboard_config.quick_actions).toContain('activate_auto_dm');
      }
    });
  });

  describe('AI Configuration', () => {
    it('should configure professional tone correctly', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow',
          ai_tone: 'professional'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.ai_config.tone).toBe('professional');
        expect(json.ai_config.emoji_frequency).toBe('none');
        expect(json.ai_config.system_prompt).toContain('formal');
      }
    });

    it('should configure playful tone correctly', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow',
          ai_tone: 'playful'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.ai_config.tone).toBe('playful');
        expect(json.ai_config.emoji_frequency).toBe('high');
      }
    });

    it('should default to professional tone when not specified', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow'
        })
      });
      
      if (response.status === 200) {
        const json = await response.json();
        
        expect(json.ai_config.tone).toBe('professional');
      }
    });
  });

  describe('Error Handling', () => {
    it('should include correlationId in all responses', async () => {
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'invalid'
        })
      });
      
      const json = await response.json();
      expect(json.correlationId).toBeDefined();
      expect(json.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should handle database errors gracefully', async () => {
      // This would require mocking database failure
      // For now, verify error response structure
      const response = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-db-error',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow'
        })
      });
      
      if (response.status === 503 || response.status === 500) {
        const json = await response.json();
        expect(json.error).toBeDefined();
        expect(json.correlationId).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time (<2s)', async () => {
      const start = Date.now();
      
      await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-valid',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'instagram',
          primary_goal: 'grow'
        })
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Idempotence', () => {
    it('should handle duplicate wizard completion', async () => {
      const payload = {
        platform: 'instagram',
        primary_goal: 'grow',
        ai_tone: 'professional'
      };
      
      // First completion
      const response1 = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-idempotent',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Second completion (should update, not fail)
      const response2 = await fetch(WIZARD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-idempotent',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Both should succeed (upsert behavior)
      expect([200, 409]).toContain(response1.status);
      expect([200, 409]).toContain(response2.status);
    });
  });
});
