'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIDraftAssistantProps {
  fanMessage: string;
  fanData: {
    name: string;
    rfmSegment?: string;
    totalSpent?: number;
    lastActive?: string;
  };
  persona?: {
    name: string;
    style_guide?: string;
  };
  onSendDraft: (message: string) => void;
  onEscalate?: (reason: string) => void;
}

export function AIDraftAssistant({ 
  fanMessage, 
  fanData, 
  persona,
  onSendDraft,
  onEscalate 
}: AIDraftAssistantProps) {
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [guardrailsTriggered, setGuardrailsTriggered] = useState<string[]>([]);
  const [upsellOpportunity, setUpsellOpportunity] = useState(false);
  const [ppvPrice, setPpvPrice] = useState<number | null>(null);

  const generateDraft = async () => {
    setIsGenerating(true);
    setGuardrailsTriggered([]);
    
    try {
      const response = await fetch('/api/ofm/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanMessage,
          fanData: {
            name: fanData.name,
            rfmSegment: fanData.rfmSegment || 'UNKNOWN',
            lastActive: fanData.lastActive || new Date().toISOString(),
            totalSpent: fanData.totalSpent || 0,
            messageCount: 1,
            propensityScore: 0.5
          },
          persona: {
            name: persona?.name || 'Creator',
            style_guide: persona?.style_guide || 'Be friendly and engaging',
            tone_keywords: ['warm', 'playful', 'authentic'],
            templates: {
              welcome: "Hey ${name}! So glad to hear from you 💕",
              upsell: "I have something special just for you... interested? 😘",
              reactivation: "Haven't heard from you in a while! Miss our chats 💭"
            }
          },
          guardrails: {
            forbidden_words: ['whatsapp', 'phone', 'meet', 'telegram'],
            escalation_triggers: ['refund', 'chargeback', 'legal', 'police'],
            frequency_limits: { max_per_hour: 5, cooldown_minutes: 10 }
          }
        })
      });

      const data = await response.json();
      
      if (data.action === 'ESCALATE') {
        setGuardrailsTriggered(data.guardrails_triggered || []);
        if (onEscalate) {
          onEscalate(data.reason || 'Escalation required');
        }
      } else {
        setDraft(data.draft_message);
        setConfidence(data.confidence_score);
        setReasoning(data.reasoning);
        setUpsellOpportunity(data.upsell_opportunity);
        setPpvPrice(data.recommended_ppv_price);
      }
    } catch (error) {
      console.error('Failed to generate draft:', error);
      setDraft('');
      setReasoning('Failed to generate draft. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    if (draft) {
      onSendDraft(draft);
      setDraft('');
      setConfidence(0);
      setReasoning('');
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-sm">AI Draft Assistant</span>
        </div>
        <Button
          onClick={generateDraft}
          disabled={isGenerating || !fanMessage}
          size="sm"
          variant="outline"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Draft'
          )}
        </Button>
      </div>

      {guardrailsTriggered.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Escalation Required</p>
              <p className="text-xs text-red-600 mt-1">
                Triggered: {guardrailsTriggered.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {draft && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full text-sm resize-none focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
              {upsellOpportunity && (
                <span className="flex items-center gap-1 text-green-600">
                  <span>💰</span>
                  Upsell opportunity
                  {ppvPrice && ` ($${ppvPrice})`}
                </span>
              )}
            </div>
            <Button
              onClick={handleSend}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send className="w-3 h-3 mr-1" />
              Send Draft
            </Button>
          </div>

          {reasoning && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">AI Reasoning</summary>
              <p className="mt-1">{reasoning}</p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}