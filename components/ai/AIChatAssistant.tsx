'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { sendAIChat } from '@/lib/services/ai-chat';

type AIChatAssistantProps = {
  fanId: string;
  fanName?: string;
  onSendMessage?: (message: string) => void;
};

type AIResponse = {
  response: string;
  confidence: number;
  suggestedUpsell?: string;
  salesTactics?: string[];
};

export function AIChatAssistant({ fanId, fanName, onSendMessage }: AIChatAssistantProps) {
  const [message, setMessage] = useState('');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateResponse = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const data = await sendAIChat({
        fanId,
        message: message.trim(),
        context: {
          fanName,
        },
      });
      setAiResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  const handleUseResponse = () => {
    if (aiResponse && onSendMessage) {
      onSendMessage(aiResponse.response);
      setMessage('');
      setAiResponse(null);
    }
  };

  return (
    <div className="ai-chat-assistant">
      <div className="assistant-header">
        <span className="assistant-icon">🤖</span>
        <h3 className="assistant-title">AI Assistant</h3>
      </div>

      <div className="assistant-input-section">
        <label htmlFor="fan-message" className="input-label">
          Fan's Message
        </label>
        <textarea
          id="fan-message"
          className="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter the fan's message to get an AI-generated response..."
          rows={4}
          disabled={loading}
        />
        
        <Button variant="primary" onClick={handleGenerateResponse} disabled={loading || !message.trim()}>
  {loading ? (
            <>
              <span className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <span className="ai-icon">✨</span>
              Generate AI Response
            </>
          )}
</Button>
      </div>

      {error && (
        <div className="assistant-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {aiResponse && (
        <div className="assistant-response">
          <div className="response-header">
            <span className="response-label">AI Suggested Response</span>
            <span className="confidence-badge">
              {Math.round(aiResponse.confidence * 100)}% confident
            </span>
          </div>

          <div className="response-content">
            {aiResponse.response}
          </div>

          {aiResponse.suggestedUpsell && (
            <div className="upsell-suggestion">
              <span className="upsell-icon">💡</span>
              <div className="upsell-content">
                <strong>Upsell Opportunity:</strong>
                <p>{aiResponse.suggestedUpsell}</p>
              </div>
            </div>
          )}

          {aiResponse.salesTactics && aiResponse.salesTactics.length > 0 && (
            <div className="sales-tactics">
              <span className="tactics-label">Sales Tactics Used:</span>
              <div className="tactics-list">
                {aiResponse.salesTactics.map((tactic, index) => (
                  <span key={index} className="tactic-tag">
                    {tactic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="response-actions">
            <Button variant="primary" onClick={handleUseResponse}>
  Use This Response
</Button>
            <Button variant="primary" onClick={handleGenerateResponse} disabled={loading}>
  Regenerate
</Button>
          </div>
        </div>
      )}
    </div>
  );
}
