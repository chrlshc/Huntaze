import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider } from '@/src/services/llm-providers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const body = await request.json();
    const {
      fanMessage,
      fanData,
      persona,
      guardrails,
      conversationId
    } = body;

    // Validate required fields
    if (!fanMessage || !fanData || !persona) {
      const r = NextResponse.json({ error: 'Missing required fields: fanMessage, fanData, persona', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Get LLM provider
    const provider = getLLMProvider(process.env.LLM_PROVIDER);

    // Generate draft
    const llmResponse = await provider.generateDraft({
      fanMessage,
      fanData,
      persona,
      platform: 'onlyfans'
    });

    // Validate against guardrails
    const validation = await provider.validateContent(
      llmResponse.draft,
      guardrails || {
        forbidden_words: ['whatsapp', 'phone', 'meet', 'telegram', 'signal'],
        escalation_triggers: ['refund', 'chargeback', 'legal', 'lawyer', 'police'],
        max_length: 500,
        block_external_links: true
      }
    );

    // Check if we need to escalate
    const shouldEscalate = !validation.valid || 
                          validation.triggered_rules.some(rule => rule.startsWith('escalation:'));

    // Prepare response
    const response = {
      action: shouldEscalate ? 'ESCALATE' : 'DRAFT',
      confidence_score: llmResponse.confidence,
      draft_message: shouldEscalate ? '' : llmResponse.draft,
      reasoning: llmResponse.reasoning,
      guardrails_triggered: validation.triggered_rules,
      persona_elements_used: llmResponse.persona_elements_used,
      upsell_opportunity: llmResponse.upsell_opportunity,
      recommended_ppv_price: llmResponse.recommended_ppv_price,
      validated: validation.valid,
      timestamp: new Date().toISOString(),
      reason: shouldEscalate ? `Triggered rules: ${validation.triggered_rules.join(', ')}` : undefined
    };

    // Log to backend if available
    try {
      await fetch(`${API_URL}/ofm/ai/draft-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...response,
          conversationId,
          fanData,
          llmProvider: provider.name
        })
      });
    } catch (error: any) {
      log.warn('ai_draft_log_failed', { error: error?.message || 'unknown_error' });
      // Don't fail the request if logging fails
    }

    const r = NextResponse.json({ ...response, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('ai_draft_failed', { error: error?.message || 'unknown_error' });
    
    // Fallback response on error
    const r = NextResponse.json({
      action: 'ESCALATE',
      confidence_score: 0,
      draft_message: '',
      reasoning: 'Error generating draft',
      guardrails_triggered: [],
      persona_elements_used: [],
      upsell_opportunity: false,
      recommended_ppv_price: null,
      validated: false,
      timestamp: new Date().toISOString(),
      reason: error.message || 'Failed to generate AI draft',
      requestId,
    }, { status: 200 }); // Return 200 even on error to not break client
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
