'use client';

/**
 * New Automation Page - Polaris Monochrome Design
 * Create a new automation using AI or manual builder
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { InfoTooltip } from '@/components/analytics/InfoTooltip';
import type { AutomationStep } from '@/lib/automations/types';
import { AssistantIcon } from '@/components/icons/AssistantIcon';
import {
  Sparkles,
  Wrench,
  Save,
  FileText,
  X,
  AlertCircle,
  Plus,
  Zap,
  MessageSquare,
  Tag,
  Clock,
  Gift,
  Trash2,
  GripVertical,
  DollarSign,
  Users,
  Instagram,
  Video,
  Share2,
} from 'lucide-react';

// Example prompts - Multi-platform
const examplePrompts = [
  'Send a welcome message when someone subscribes on any platform',
  'Cross-post my OnlyFans content to Instagram and TikTok',
  'Tag VIP fans who spend over $100 and send them a thank you',
  'Send a reminder 3 days before subscription expires',
  'Notify my team when I receive a high-value message',
  'Auto-reply to Instagram DMs with a link to my content',
];

// Step type configurations - Multi-platform triggers
const triggerTypes = [
  // Universal triggers
  { id: 'new_subscriber', name: 'New Subscriber', icon: Zap, desc: 'Any platform - new follower/subscriber', platform: 'all' },
  { id: 'message_received', name: 'Message Received', icon: MessageSquare, desc: 'Any platform - incoming DM', platform: 'all' },
  { id: 'subscription_expiring', name: 'Subscription Expiring', icon: Clock, desc: 'Before subscription ends', platform: 'all' },
  { id: 'purchase_completed', name: 'Purchase Completed', icon: DollarSign, desc: 'When a fan makes a purchase', platform: 'all' },
  { id: 'fan_inactive', name: 'Fan Inactive', icon: Users, desc: 'When a fan becomes inactive', platform: 'all' },
  // Platform-specific
  { id: 'instagram_follow', name: 'Instagram Follow', icon: Instagram, desc: 'New Instagram follower', platform: 'instagram' },
  { id: 'tiktok_follow', name: 'TikTok Follow', icon: Video, desc: 'New TikTok follower', platform: 'tiktok' },
  { id: 'content_posted', name: 'Content Posted', icon: FileText, desc: 'When you post new content', platform: 'all' },
];

const actionTypes = [
  { id: 'send_message', name: 'Send Message', icon: MessageSquare, desc: 'Send a personalized DM', glossaryId: null },
  { id: 'send_ppv', name: 'Send PPV', icon: DollarSign, desc: 'Send pay-per-view content', glossaryId: 'ppv' },
  { id: 'create_offer', name: 'Create Offer', icon: Gift, desc: 'Send a discount or promo', glossaryId: null },
  { id: 'add_tag', name: 'Add Tag', icon: Tag, desc: 'Tag for segmentation', glossaryId: null },
  { id: 'wait', name: 'Wait', icon: Clock, desc: 'Add a delay', glossaryId: null },
  { id: 'cross_post', name: 'Cross-Post', icon: Share2, desc: 'Post to other platforms', glossaryId: 'crossPost' },
];

type BuilderMode = 'ai' | 'manual';

export default function NewAutomationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('ai') === 'true' ? 'ai' : 'ai';
  
  const [mode, setMode] = useState<BuilderMode>(initialMode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI Generator state
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedFlow, setGeneratedFlow] = useState<{
    name: string;
    description: string;
    steps: AutomationStep[];
    confidence: number;
  } | null>(null);

  // Generate flow from AI
  const generateFlow = async () => {
    if (!prompt.trim()) {
      setError('Décris ce que tu veux automatiser');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedFlow(null);

    try {
      const response = await fetch('/api/ai/automation-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedFlow(data.data);
      } else {
        setError(data.error || 'Erreur lors de la génération');
      }
    } catch {
      setError('Impossible de se connecter au service IA');
    } finally {
      setGenerating(false);
    }
  };

  // Apply generated flow
  const applyFlow = () => {
    if (generatedFlow) {
      setName(generatedFlow.name);
      setDescription(generatedFlow.description);
      setSteps(generatedFlow.steps);
      setGeneratedFlow(null);
      setPrompt('');
      setMode('manual');
    }
  };

  // Add a step
  const addStep = (type: 'trigger' | 'action', stepId: string) => {
    const newStep: AutomationStep = {
      id: `step-${Date.now()}`,
      type,
      name: stepId,
      config: {},
    };
    setSteps([...steps, newStep]);
  };

  // Remove a step
  const removeStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
  };

  // Save automation
  const saveAutomation = async (status: 'draft' | 'active') => {
    if (!name.trim()) {
      setError('Donne un nom à ton automation');
      return;
    }

    if (steps.length === 0) {
      setError('Ajoute au moins une étape');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, steps, status }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/automations');
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Get step display info
  const getStepInfo = (step: AutomationStep) => {
    const allTypes = [...triggerTypes, ...actionTypes];
    return allTypes.find(t => t.id === step.name) || { name: step.name, icon: Zap, desc: '' };
  };

  return (
    <ContentPageErrorBoundary pageName="New Automation">
      <div className="polaris-analytics" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 60px)', background: '#fff' }}>
        {/* Top Header Bar - Clean minimal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: '#fff',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#303030' }}>New automation</span>
          <Link href="/automations">
            <button style={{ 
              background: 'none', 
              border: 'none', 
              padding: 8, 
              cursor: 'pointer', 
              color: '#8C9196',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <X size={20} />
            </button>
          </Link>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', background: '#fff' }}>
          {/* Mode Selector - Clean tabs */}
          <div style={{ 
            display: 'flex', 
            gap: 6, 
            marginBottom: 28, 
            justifyContent: 'center',
            background: '#F5F5F5',
            padding: 4,
            borderRadius: 12,
            width: 'fit-content',
            margin: '0 auto 28px',
          }}>
            <button 
              onClick={() => setMode('ai')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 550,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: mode === 'ai' ? '#fff' : 'transparent',
                color: mode === 'ai' ? '#303030' : '#616161',
                boxShadow: mode === 'ai' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Sparkles size={14} />
              AI Generator
            </button>
            <button 
              onClick={() => setMode('manual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 550,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: mode === 'manual' ? '#fff' : 'transparent',
                color: mode === 'manual' ? '#303030' : '#616161',
                boxShadow: mode === 'manual' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Wrench size={14} />
              Manual Builder
            </button>
          </div>

          {/* AI Generator Mode - Center Content */}
          {mode === 'ai' && !generatedFlow && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 280,
              textAlign: 'center',
              padding: '20px 20px 60px',
            }}>
              <AssistantIcon size={56} />
              <p style={{ 
                fontSize: 15, 
                color: '#666', 
                margin: '20px 0 4px 0',
                fontWeight: 400,
              }}>
                Hey there
              </p>
              <h2 style={{ 
                fontSize: 24, 
                fontWeight: 600, 
                color: '#000',
                margin: 0,
              }}>
                What do you want to automate?
              </h2>
            </div>
          )}

          {/* Generated flow preview */}
          {mode === 'ai' && generatedFlow && (
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ padding: 20, background: '#F7F7F7', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#303030' }}>{generatedFlow.name}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', background: '#E3E3E3', borderRadius: 12, color: '#008060' }}>
                    {Math.round(generatedFlow.confidence * 100)}% confidence
                  </span>
                </div>
                {generatedFlow.description && (
                  <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>{generatedFlow.description}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {generatedFlow.steps.map((step, i) => {
                    const info = getStepInfo(step);
                    return (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, height: 22, background: '#E3E3E3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 550, color: '#616161' }}>{i + 1}</span>
                        <span style={{ fontSize: 11, padding: '3px 8px', background: step.type === 'trigger' ? '#FFF4E5' : '#E6F4EA', borderRadius: 4, color: step.type === 'trigger' ? '#916A00' : '#008060' }}>{step.type}</span>
                        <span style={{ fontSize: 13, color: '#303030' }}>{info.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={applyFlow}
                    style={{ flex: 1, padding: '11px 16px', background: '#303030', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 550, cursor: 'pointer' }}
                  >
                    Use This Flow
                  </button>
                  <button
                    onClick={() => setGeneratedFlow(null)}
                    style={{ padding: '11px 16px', background: '#fff', color: '#303030', border: '1px solid #E3E3E3', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Builder Mode */}
          {mode === 'manual' && (
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              {/* Name & Description Card */}
              <div className="p-card" style={{ marginBottom: 16 }}>
                <div className="p-card-body">
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 550, color: '#303030', marginBottom: 6 }}>
                      Automation Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Welcome New Subscribers"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E3E3E3',
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#303030',
                        background: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 550, color: '#303030', marginBottom: 6 }}>
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this automation does..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E3E3E3',
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#303030',
                        background: '#fff',
                        resize: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#303030', marginBottom: 12 }}>Workflow Steps</h3>
                
                {steps.length === 0 ? (
                  <div className="p-card">
                    <div className="p-card-body" style={{ textAlign: 'center', padding: 32 }}>
                      <div style={{ width: 48, height: 48, background: '#F1F1F1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Zap size={24} style={{ color: '#616161' }} />
                      </div>
                      <p style={{ fontSize: 14, color: '#303030', marginBottom: 4 }}>No steps yet</p>
                      <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>Start by adding a trigger, then add actions</p>
                      <button
                        onClick={() => setMode('ai')}
                        style={{ background: 'none', border: 'none', fontSize: 13, color: '#005BD3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}
                      >
                        <Sparkles size={14} />
                        Use AI to generate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-card">
                    <div className="p-card-body no-padding">
                      <div className="breakdown-list">
                        {steps.map((step, i) => {
                          const info = getStepInfo(step);
                          const Icon = info.icon;
                          return (
                            <div key={step.id} className="breakdown-item" style={{ padding: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <GripVertical size={16} style={{ color: '#8C9196', cursor: 'grab' }} />
                                <span style={{ width: 24, height: 24, background: '#F1F1F1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 550, color: '#616161' }}>{i + 1}</span>
                                <div style={{ width: 32, height: 32, background: '#F1F1F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon size={16} style={{ color: '#616161' }} />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 550, color: '#303030' }}>{info.name}</span>
                                    <span style={{ fontSize: 11, padding: '2px 6px', background: '#F1F1F1', borderRadius: 4, color: step.type === 'trigger' ? '#916A00' : '#008060' }}>{step.type}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: '#616161' }}>{info.desc}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeStep(step.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                              >
                                <Trash2 size={16} style={{ color: '#8C9196' }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Step Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {/* Triggers */}
                <div className="p-card">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E3E3E3', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, background: '#FFF4E5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={12} style={{ color: '#916A00' }} />
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#303030', margin: 0, display: 'flex', alignItems: 'center' }}>
                      Triggers
                      <InfoTooltip glossaryId="trigger" size={14} />
                    </h4>
                  </div>
                  <div className="p-card-body no-padding">
                    <div className="breakdown-list">
                      {triggerTypes.map((trigger) => {
                        const Icon = trigger.icon;
                        const hasTrigger = steps.some(s => s.type === 'trigger');
                        return (
                          <button
                            key={trigger.id}
                            onClick={() => addStep('trigger', trigger.id)}
                            disabled={hasTrigger}
                            className="breakdown-item"
                            style={{ 
                              padding: 12, 
                              width: '100%', 
                              textAlign: 'left', 
                              background: 'none', 
                              border: 'none',
                              cursor: hasTrigger ? 'not-allowed' : 'pointer',
                              opacity: hasTrigger ? 0.5 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, background: '#F1F1F1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={14} style={{ color: '#616161' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 550, color: '#303030' }}>{trigger.name}</div>
                                <div style={{ fontSize: 11, color: '#616161' }}>{trigger.desc}</div>
                              </div>
                            </div>
                            <Plus size={14} style={{ color: '#8C9196' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-card">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E3E3E3', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, background: '#E6F4EA', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={12} style={{ color: '#008060' }} />
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#303030', margin: 0, display: 'flex', alignItems: 'center' }}>
                      Actions
                      <InfoTooltip glossaryId="action" size={14} />
                    </h4>
                  </div>
                  <div className="p-card-body no-padding">
                    <div className="breakdown-list">
                      {actionTypes.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => addStep('action', action.id)}
                            className="breakdown-item"
                            style={{ 
                              padding: 12, 
                              width: '100%', 
                              textAlign: 'left', 
                              background: 'none', 
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, background: '#F1F1F1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={14} style={{ color: '#616161' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 550, color: '#303030', display: 'flex', alignItems: 'center' }}>
                                  {action.name}
                                  {action.glossaryId && <InfoTooltip glossaryId={action.glossaryId} size={12} />}
                                </div>
                                <div style={{ fontSize: 11, color: '#616161' }}>{action.desc}</div>
                              </div>
                            </div>
                            <Plus size={14} style={{ color: '#8C9196' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ 
                  padding: 12, 
                  background: '#FFF4E5', 
                  border: '1px solid #FFD79D', 
                  borderRadius: 8, 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <AlertCircle size={16} style={{ color: '#916A00' }} />
                  <span style={{ fontSize: 13, color: '#916A00' }}>{error}</span>
                </div>
              )}

              {/* Save Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => saveAutomation('active')}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: saving ? '#E3E3E3' : '#303030',
                    color: saving ? '#8C9196' : '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 550,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save & Activate'}
                </button>
                <button
                  onClick={() => saveAutomation('draft')}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: '#fff',
                    color: '#303030',
                    border: '1px solid #E3E3E3',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 550,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <FileText size={16} />
                  Save as Draft
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Bar - Majordome Style */}
        {mode === 'ai' && (
          <div style={{
            padding: '16px 20px 24px 20px',
            background: '#ffffff',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              background: '#fff',
              borderRadius: 30,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
            }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !generating && prompt.trim() && generateFlow()}
                placeholder="Ask anything..."
                disabled={generating}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  color: '#333',
                  outline: 'none',
                  padding: '6px 8px',
                }}
              />
              <button
                onClick={generateFlow}
                disabled={generating || !prompt.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                <Plus size={20} style={{ color: '#666' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </ContentPageErrorBoundary>
  );
}
