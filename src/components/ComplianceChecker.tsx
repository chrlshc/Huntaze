"use client";

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Loader2, Wand2 } from 'lucide-react';
import { useComplianceCheck, type ComplianceResult } from '@/hooks/useComplianceCheck';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ComplianceCheckerProps {
  content: string;
  niche: string;
  context: 'dm_message' | 'post_caption' | 'bio' | 'hook';
  className?: string;
  autoCheck?: boolean;
  onContentChange?: (newContent: string) => void;
}

const platformIcons: Record<'instagram' | 'tiktok' | 'reddit' | 'onlyfans', string> = {
  instagram: '📸',
  tiktok: '🎵',
  reddit: '🤖',
  onlyfans: '🔒',
};

// Smart fix mapping + patterns (context-aware)
const getSmartFix = (risk: any, originalContent: string, context: string): string | null => {
  const direct: Record<string, string> = {
    onlyfans: context === 'hook' ? 'exclusive content' : 'my VIP space',
    'link in bio': 'check my profile',
    'dm me': 'message me',
    buy: context === 'hook' ? 'unlock' : 'access',
    sell: 'share',
    purchase: 'get',
    cash: 'support',
    money: 'tips',
    payment: 'support',
    // risky emojis
    '🍆': '💜',
    '🍑': '🍀',
    '💦': '✨',
    '🔞': '🔥',
  };

  const patterns: { pattern: RegExp; replacement: string }[] = [
    { pattern: /\b(nude|naked|sex)\b/gi, replacement: context === 'hook' ? 'intimate' : 'exclusive' },
    { pattern: /\b(naughty|dirty|spicy)\b/gi, replacement: context === 'hook' ? 'playful' : 'exciting' },
    { pattern: /\b(subscribe|sub)\b/gi, replacement: 'follow' },
  ];

  let fixed = originalContent;
  let changed = false;

  // Apply direct replacements for words (word boundary) and emojis (literal)
  Object.entries(direct).forEach(([bad, good]) => {
    if (/^[\p{L}\p{N}_-]+$/u.test(bad)) {
      const re = new RegExp(`\\b${bad}\\b`, 'gi');
      if (re.test(fixed)) {
        fixed = fixed.replace(re, good);
        changed = true;
      }
    } else {
      if (fixed.includes(bad)) {
        const re = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        fixed = fixed.replace(re, good);
        changed = true;
      }
    }
  });

  patterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changed = true;
    }
  });

  return changed ? fixed : null;
};

const ComplianceChecker = ({ content, niche, context, className = '', autoCheck = true, onContentChange }: ComplianceCheckerProps) => {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const { checkContent, isChecking } = useComplianceCheck();
  const { track } = useAnalytics();

  useEffect(() => {
    if (!autoCheck) return;
    if ((content?.trim()?.length || 0) < 10) return;
    const id = setTimeout(() => {
      checkContent(content, niche, context).then(setResult).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [autoCheck, content, niche, context, checkContent]);

  const getOverallIcon = () => {
    if (isChecking) return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
    if (!result) return <div className="w-4 h-4 bg-gray-200 rounded-full" />;
    switch (result.overall) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'danger': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-200 rounded-full" />;
    }
  };

  const panelColor = !result
    ? 'bg-gray-50 border-gray-200'
    : result.overall === 'safe'
    ? 'bg-green-50 border-green-200'
    : result.overall === 'warning'
    ? 'bg-yellow-50 border-yellow-200'
    : 'bg-red-50 border-red-200';

  const pStatus = (platform: keyof typeof platformIcons) => {
    if (!result) return 'gray';
    return result.platforms[platform];
  };

  const quickFixFor = useMemo(() => (risk: any) => getSmartFix(risk, content, context), [content, context]);

  const applyQuickFix = async (risk: any) => {
    if (!onContentChange) return;
    const fixed = quickFixFor(risk);
    if (!fixed) return;
    setIsApplyingFix(true);
    try {
      onContentChange(fixed);
      try {
        track('compliance_quick_fix_applied', {
          niche,
          context,
          issue: risk?.issue,
          original_length: content?.length || 0,
          fixed_length: fixed.length,
          success: true,
        });
      } catch {}
      setTimeout(() => {
        checkContent(fixed, niche, context).then(setResult).catch(() => {});
      }, 400);
    } catch (e: any) {
      try { track('compliance_quick_fix_failed', { niche, context, error: e?.message || 'unknown' }); } catch {}
    } finally {
      setIsApplyingFix(false);
    }
  };

  const applyBulkFixes = () => {
    if (!onContentChange || !result?.risks?.length) return;
    let fixed = content;
    result.risks.forEach((r) => {
      const f = getSmartFix(r, fixed, context);
      if (f) fixed = f;
    });
    if (fixed !== content) {
      onContentChange(fixed);
      try { track('compliance_bulk_fix_applied', { niche, context, fixes_count: result.risks.length }); } catch {}
      setTimeout(() => {
        checkContent(fixed, niche, context).then(setResult).catch(() => {});
      }, 400);
    }
  };

  return (
    <div className={`border-2 rounded-lg p-3 transition-all ${panelColor} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getOverallIcon()}
          <span className="text-sm font-medium">
            {isChecking
              ? 'Checking compliance...'
              : !result
              ? 'Ready to check'
              : result.overall === 'safe'
              ? 'Compliance OK'
              : result.overall === 'warning'
              ? `${result.risks.length} potential issues`
              : `${result.risks.length} violations detected`}
          </span>
        </div>
        {!autoCheck && (
          <button
            onClick={() => checkContent(content, niche, context).then(setResult)}
            disabled={isChecking || (content?.trim()?.length || 0) < 10}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Check'}
          </button>
        )}
      </div>

      {result && (
        <div className="flex items-center gap-2 mb-2">
          {(Object.keys(platformIcons) as (keyof typeof platformIcons)[]).map((platform) => (
            <div
              key={platform}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                pStatus(platform) === 'safe'
                  ? 'bg-green-100 text-green-700'
                  : pStatus(platform) === 'warning'
                  ? 'bg-yellow-100 text-yellow-700'
                  : pStatus(platform) === 'danger'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
              title={`${platform}: ${result.platforms[platform]}`}
            >
              <span>{platformIcons[platform]}</span>
              <span className="capitalize">{platform}</span>
            </div>
          ))}
        </div>
      )}

      {result && result.risks.length > 0 && (
        <div className="space-y-2">
          {result.risks.slice(0, 2).map((risk, idx) => {
            const quickFix = quickFixFor(risk);
            return (
              <div key={idx} className="text-xs border-t border-gray-200 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          risk.severity === 'high' ? 'bg-red-500' : risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                      />
                      <span className="font-medium">{platformIcons[risk.platform]} {risk.issue}</span>
                    </div>
                    <div className="text-gray-600 ml-3">{risk.suggestion}</div>
                  </div>
                  {quickFix && onContentChange && (
                    <button
                      onClick={() => applyQuickFix(risk)}
                      disabled={isApplyingFix}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      title={`Fix: ${quickFix.slice(0, 50)}${quickFix.length > 50 ? '…' : ''}`}
                    >
                      {isApplyingFix ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      {isApplyingFix ? 'Fixing…' : 'Quick Fix'}
                    </button>
                  )}
                </div>
                {quickFix && (
                  <div className="ml-3 mt-1 text-xs">
                    <div className="text-gray-500">Suggested fix:</div>
                    <div className="bg-green-50 text-green-800 p-2 rounded mt-1 font-mono text-[11px]">
                      "{quickFix.length > 120 ? quickFix.slice(0, 120) + '…' : quickFix}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {result.risks.length > 2 && (
            <div className="text-xs text-gray-500 ml-3 border-t border-gray-200 pt-1">+{result.risks.length - 2} more issues (fix these first)</div>
          )}
        </div>
      )}

      {result && result.risks.length > 1 && onContentChange && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={applyBulkFixes}
            disabled={isApplyingFix}
            className="w-full text-xs px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            🪄 Fix All Issues ({result.risks.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecker;
