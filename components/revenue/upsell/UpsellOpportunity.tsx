'use client';

import { useState } from 'react';
import { UpsellOpportunity as UpsellOpportunityType } from '@/lib/services/revenue/types';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface UpsellOpportunityProps {
  opportunity: UpsellOpportunityType;
  onSend: (opportunityId: string) => Promise<void>;
  onDismiss: (opportunityId: string) => void;
  loading?: boolean;
}

export function UpsellOpportunity({
  opportunity,
  onSend,
  onDismiss,
  loading = false,
}: UpsellOpportunityProps) {
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState(opportunity.messagePreview);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(opportunity.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to send upsell:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getBuyRateColor = (buyRate: number) => {
    if (buyRate >= 0.5) return 'text-green-700';
    if (buyRate >= 0.3) return 'text-yellow-700';
    return 'text-orange-700';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (showSuccess) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 animate-pulse">
        <div className="flex items-center justify-center gap-3">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Upsell Sent!</h3>
            <p className="text-sm text-green-700">Message delivered to {opportunity.fanName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{opportunity.fanName}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getConfidenceColor(opportunity.confidence)}`}>
              {Math.round(opportunity.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Purchased {opportunity.triggerPurchase.item} • {formatDate(opportunity.triggerPurchase.date)}
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => onDismiss(opportunity.id)}
          disabled={isSending}
          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Dismiss opportunity"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Trigger Purchase */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-600 mb-1">Trigger Purchase</div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{opportunity.triggerPurchase.item}</span>
          <span className="text-sm font-semibold text-gray-900">
            ${opportunity.triggerPurchase.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Suggested Upsell */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <div className="text-xs font-medium text-blue-700">Suggested Upsell</div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {opportunity.suggestedProduct.name}
            </h4>
            <p className="text-xs text-gray-600">{opportunity.suggestedProduct.description}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-700">
              ${opportunity.suggestedProduct.price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Buy Rate</div>
          <div className={`text-xl font-bold ${getBuyRateColor(opportunity.buyRate)}`}>
            {Math.round(opportunity.buyRate * 100)}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Expected Revenue</div>
          <div className="text-xl font-bold text-green-700">
            ${opportunity.expectedRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Message Preview</label>
          <Button 
            variant="primary" 
            onClick={() => setIsEditingMessage(!isEditingMessage)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {isEditingMessage ? 'Cancel' : 'Edit'}
          </Button>
        </div>
        {isEditingMessage ? (
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{customMessage}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          onClick={() => onDismiss(opportunity.id)}
          disabled={isSending}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Dismiss
        </Button>
        <button
          onClick={handleSend}
          disabled={isSending || loading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : (
            'Send Now'
          )}
        </button>
      </div>
    </Card>
  );
}
