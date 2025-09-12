"use client";

import { useState, useCallback } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export interface ComplianceRisk {
  platform: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  severity: 'low' | 'medium' | 'high';
  issue: string;
  suggestion: string;
}

export interface ComplianceResult {
  overall: 'safe' | 'warning' | 'danger';
  risks: ComplianceRisk[];
  platforms: {
    instagram: 'safe' | 'warning' | 'danger';
    tiktok: 'safe' | 'warning' | 'danger';
    reddit: 'safe' | 'warning' | 'danger';
    onlyfans: 'safe' | 'warning' | 'danger';
  };
}

export const useComplianceCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { track } = useAnalytics();

  const checkContent = useCallback(
    async (
      content: string,
      niche: string,
      context: 'dm_message' | 'post_caption' | 'bio' | 'hook'
    ): Promise<ComplianceResult> => {
      setIsChecking(true);

      try {
        try { track('compliance_check_started', { niche, context, content_length: content?.length || 0 }); } catch {}

        const response = await fetch('/api/content/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, niche, context }),
        });

        const result = await response.json();

        try {
          track('compliance_check_completed', {
            niche,
            context,
            overall_status: result?.overall,
            risk_count: result?.risks?.length || 0,
          });
        } catch {}

        return result as ComplianceResult;
      } catch (error: any) {
        try { track('compliance_check_failed', { niche, context, error: error?.message || 'unknown' }); } catch {}

        // Fallback: warn
        return {
          overall: 'warning',
          risks: [{
            platform: 'instagram',
            severity: 'medium',
            issue: 'Unable to verify compliance',
            suggestion: 'Review content manually',
          }],
          platforms: {
            instagram: 'warning',
            tiktok: 'warning',
            reddit: 'warning',
            onlyfans: 'safe',
          },
        };
      } finally {
        setIsChecking(false);
      }
    },
    [track]
  );

  return { checkContent, isChecking };
};

