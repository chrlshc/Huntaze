'use client';

import { useState, useEffect } from 'react';
import { contentValidationService, ValidationResult } from '@/lib/services/contentValidationService';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface ContentValidatorProps {
  content: {
    text?: string;
    mediaAssets?: Array<{ type: string; url: string; alt_text?: string; width?: number; height?: number }>;
    platforms?: string[];
  };
  onValidationChange?: (result: ValidationResult) => void;
}

export default function ContentValidator({ content, onValidationChange }: ContentValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const result = contentValidationService.validateContent(content);
    setValidationResult(result);
    onValidationChange?.(result);
  }, [content]);

  if (!validationResult) {
    return null;
  }

  const { isValid, issues, score } = validationResult;
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <Card className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Content Validation</h4>
        <div className={`px-3 py-1 rounded-full ${getScoreBgColor(score)}`}>
          <span className={`font-bold ${getScoreColor(score)}`}>{score}/100</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {contentValidationService.getValidationSummary(validationResult)}
        </p>
      </div>

      {issues.length > 0 && (
        <>
          <div className="flex gap-4 mb-3 text-sm">
            {errors.length > 0 && (
              <span className="text-red-600">❌ {errors.length} error{errors.length !== 1 ? 's' : ''}</span>
            )}
            {warnings.length > 0 && (
              <span className="text-yellow-600">⚠️ {warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
            )}
            {infos.length > 0 && (
              <span className="text-blue-600">ℹ️ {infos.length} suggestion{infos.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {showDetails ? '▼ Hide details' : '▶ Show details'}
          </button>

          {showDetails && (
            <div className="space-y-2">
              {errors.map((issue, idx) => (
                <div key={`error-${idx}`} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-red-800">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="text-xs text-red-600 mt-1">💡 {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {warnings.map((issue, idx) => (
                <div key={`warning-${idx}`} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">⚠️</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-yellow-800">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="text-xs text-yellow-600 mt-1">💡 {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {infos.map((issue, idx) => (
                <div key={`info-${idx}`} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">ℹ️</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-800">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="text-xs text-blue-600 mt-1">💡 {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {issues.length === 0 && (
        <div className="text-center py-4 text-green-600">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm font-medium">All checks passed!</div>
        </div>
      )}
    </Card>
  );
}
