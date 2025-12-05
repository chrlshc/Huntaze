'use client';

import { useState, useCallback } from 'react';
import { 
  Bot, 
  Power, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  Settings,
  Sparkles,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Types
export type AutoReplyTone = 'friendly' | 'professional' | 'flirty' | 'casual';
export type AutoReplyStyle = 'short' | 'medium' | 'detailed';

export interface AutoReplyConfig {
  enabled: boolean;
  tone: AutoReplyTone;
  style: AutoReplyStyle;
  responseDelay: number; // in seconds
  personality: string;
  boundaries: string[];
  flagComplexMessages: boolean;
  requireApproval: boolean;
}

export interface AutoReplyStats {
  totalResponses: number;
  approvedResponses: number;
  flaggedMessages: number;
  avgResponseTime: number;
}

export interface RecentAutoReply {
  id: string;
  fanName: string;
  originalMessage: string;
  autoReply: string;
  timestamp: Date;
  status: 'sent' | 'pending' | 'flagged';
  isComplex: boolean;
}

export interface AutoReplyConfigPanelProps {
  initialConfig?: Partial<AutoReplyConfig>;
  stats?: AutoReplyStats;
  recentReplies?: RecentAutoReply[];
  onConfigChange?: (config: AutoReplyConfig) => void;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

const DEFAULT_CONFIG: AutoReplyConfig = {
  enabled: false,
  tone: 'friendly',
  style: 'medium',
  responseDelay: 30,
  personality: '',
  boundaries: [],
  flagComplexMessages: true,
  requireApproval: false
};

const TONE_OPTIONS: { value: AutoReplyTone; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', description: 'Business-like and polite' },
  { value: 'flirty', label: 'Flirty', description: 'Playful and engaging' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal' }
];

const STYLE_OPTIONS: { value: AutoReplyStyle; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: '1-2 sentences' },
  { value: 'medium', label: 'Medium', description: '2-4 sentences' },
  { value: 'detailed', label: 'Detailed', description: '4+ sentences' }
];

const DELAY_OPTIONS = [
  { value: 0, label: 'Instant' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' }
];

export function AutoReplyConfigPanel({
  initialConfig,
  stats,
  recentReplies = [],
  onConfigChange,
  onToggle,
  className = ''
}: AutoReplyConfigPanelProps) {
  const [config, setConfig] = useState<AutoReplyConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });
  const [activeTab, setActiveTab] = useState<'config' | 'recent' | 'stats'>('config');

  const handleToggle = useCallback(() => {
    const newEnabled = !config.enabled;
    const newConfig = { ...config, enabled: newEnabled };
    setConfig(newConfig);
    onToggle?.(newEnabled);
    onConfigChange?.(newConfig);
  }, [config, onToggle, onConfigChange]);

  const handleConfigUpdate = useCallback(<K extends keyof AutoReplyConfig>(
    key: K, 
    value: AutoReplyConfig[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [config, onConfigChange]);

  const handleBoundaryAdd = useCallback((boundary: string) => {
    if (boundary.trim() && !config.boundaries.includes(boundary.trim())) {
      handleConfigUpdate('boundaries', [...config.boundaries, boundary.trim()]);
    }
  }, [config.boundaries, handleConfigUpdate]);

  const handleBoundaryRemove = useCallback((boundary: string) => {
    handleConfigUpdate('boundaries', config.boundaries.filter(b => b !== boundary));
  }, [config.boundaries, handleConfigUpdate]);

  return (
    <div className={`auto-reply-config ${className}`} data-testid="auto-reply-config">
      {/* Status Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${config.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <Bot className={`w-6 h-6 ${config.enabled ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Auto-Reply</h3>
                <p className="text-sm text-muted-foreground">
                  {config.enabled ? 'Active - Responding to messages automatically' : 'Disabled - Manual responses only'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  config.enabled 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-gray-500/20 text-gray-500'
                }`}
                data-testid="auto-reply-status"
                data-status={config.enabled ? 'enabled' : 'disabled'}
              >
                {config.enabled ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Inactive</span>
                  </>
                )}
              </div>
              <Button
                variant={config.enabled ? 'destructive' : 'default'}
                onClick={handleToggle}
                className="gap-2"
              >
                <Power className="w-4 h-4" />
                {config.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'config' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('config')}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Configuration
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'recent' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('recent')}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Recent Replies
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stats' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Statistics
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Tone Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response Tone</CardTitle>
              <CardDescription>Choose how your auto-replies should sound</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      config.tone === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleConfigUpdate('tone', option.value)}
                    data-testid={`tone-${option.value}`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response Style</CardTitle>
              <CardDescription>Set the length of auto-replies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      config.style === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleConfigUpdate('style', option.value)}
                    data-testid={`style-${option.value}`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Response Delay */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Response Delay
              </CardTitle>
              <CardDescription>Add a natural delay before sending auto-replies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {DELAY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      config.responseDelay === option.value
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleConfigUpdate('responseDelay', option.value)}
                    data-testid={`delay-${option.value}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personality Description</CardTitle>
              <CardDescription>Describe your persona for more personalized responses</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full p-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="E.g., I'm a fitness enthusiast who loves connecting with my fans. I'm playful but professional..."
                value={config.personality}
                onChange={(e) => handleConfigUpdate('personality', e.target.value)}
                data-testid="personality-input"
              />
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-sm">Flag Complex Messages</div>
                  <div className="text-xs text-muted-foreground">
                    Mark messages requiring personal attention for manual review
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.flagComplexMessages}
                  onChange={(e) => handleConfigUpdate('flagComplexMessages', e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                  data-testid="flag-complex-checkbox"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-sm">Require Approval</div>
                  <div className="text-xs text-muted-foreground">
                    Review all auto-replies before sending
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.requireApproval}
                  onChange={(e) => handleConfigUpdate('requireApproval', e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                  data-testid="require-approval-checkbox"
                />
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Replies Tab */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          {recentReplies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent auto-replies yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-replies will appear here once enabled
                </p>
              </CardContent>
            </Card>
          ) : (
            recentReplies.map((reply) => (
              <Card key={reply.id} className={reply.isComplex ? 'border-yellow-500/50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reply.fanName}</span>
                      {reply.isComplex && (
                        <span 
                          className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full"
                          data-testid="complex-flag"
                        >
                          Complex
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        reply.status === 'sent' 
                          ? 'bg-green-500/20 text-green-500'
                          : reply.status === 'pending'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {reply.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reply.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Original message:</p>
                      <p className="text-sm">{reply.originalMessage}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-primary mb-1">Auto-reply:</p>
                      <p className="text-sm">{reply.autoReply}</p>
                    </div>
                  </div>
                  {reply.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="default" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <XCircle className="w-3 h-3" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats?.totalResponses ?? 0}</div>
              <div className="text-sm text-muted-foreground">Total Responses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{stats?.approvedResponses ?? 0}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">{stats?.flaggedMessages ?? 0}</div>
              <div className="text-sm text-muted-foreground">Flagged</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats?.avgResponseTime ?? 0}s</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AutoReplyConfigPanel;
