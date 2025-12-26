'use client';

/**
 * Edit Automation Page - Huntaze Monochrome Design
 * Edit an existing automation workflow
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FlowBuilder } from '@/components/automations/FlowBuilder';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { z } from 'zod';
import type { AutomationStep, AutomationStatus } from '@/lib/automations/types';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { automationDetailResponseSchema } from '@/lib/schemas/api-responses';

type AutomationDetailResponse = z.infer<typeof automationDetailResponseSchema>;
type AutomationFlowDto = AutomationDetailResponse['data'];

// Huntaze Design Tokens
const hzStyles = `
  .hz-automation-edit {
    --hz-radius-card: 14px;
    --hz-radius-icon: 8px;
    --hz-space-xs: 8px;
    --hz-space-sm: 12px;
    --hz-space-md: 16px;
    --hz-space-lg: 24px;
    --hz-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
    max-width: 900px;
    margin: 0 auto;
    padding: var(--hz-space-lg);
  }
  .hz-auto-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--hz-space-lg);
    gap: var(--hz-space-md);
  }
  .hz-auto-header-left {
    display: flex;
    align-items: flex-start;
    gap: var(--hz-space-md);
  }
  .hz-auto-back {
    width: 36px;
    height: 36px;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #616161;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 140ms ease;
    flex-shrink: 0;
  }
  .hz-auto-back:hover { background: #f3f4f6; color: #303030; border-color: #d1d5db; }
  .hz-auto-title {
    font-size: 22px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 4px;
  }
  .hz-auto-subtitle {
    font-size: 13px;
    color: #616161;
    margin: 0;
  }
  .hz-auto-delete {
    width: 36px;
    height: 36px;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #dc2626;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 140ms ease;
  }
  .hz-auto-delete:hover { background: #fef2f2; border-color: #fecaca; }
  .hz-auto-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
    padding: var(--hz-space-md);
    box-shadow: var(--hz-shadow-card);
    margin-bottom: var(--hz-space-md);
  }
  .hz-auto-form-group {
    margin-bottom: var(--hz-space-md);
  }
  .hz-auto-form-group:last-child { margin-bottom: 0; }
  .hz-auto-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #303030;
    margin-bottom: var(--hz-space-xs);
  }
  .hz-auto-input {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-icon);
    background: #fff;
    color: #303030;
    transition: border-color 140ms ease, box-shadow 140ms ease;
  }
  .hz-auto-input:focus {
    outline: none;
    border-color: #303030;
    box-shadow: 0 0 0 2px rgba(48, 48, 48, 0.1);
  }
  .hz-auto-input::placeholder { color: #9ca3af; }
  .hz-auto-textarea {
    resize: none;
    min-height: 60px;
  }
  .hz-auto-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 40px;
  }
  .hz-auto-section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 var(--hz-space-md);
  }
  .hz-auto-error {
    padding: var(--hz-space-sm) var(--hz-space-md);
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--hz-radius-icon);
    color: #dc2626;
    font-size: 13px;
    margin-bottom: var(--hz-space-md);
  }
  .hz-auto-actions {
    display: flex;
    gap: var(--hz-space-sm);
    flex-wrap: wrap;
  }
  .hz-auto-btn {
    flex: 1;
    min-width: 120px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #616161;
    cursor: pointer;
    transition: all 140ms ease;
    text-align: center;
  }
  .hz-auto-btn:hover:not(:disabled) { background: #f3f4f6; color: #303030; border-color: #d1d5db; }
  .hz-auto-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .hz-auto-btn-primary {
    background: linear-gradient(180deg, #1f1f1f, #111);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .hz-auto-btn-primary:hover:not(:disabled) { 
    background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
    border-color: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  .hz-auto-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
  }
  .hz-auto-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #303030;
    border-radius: 50%;
    animation: hz-spin 0.8s linear infinite;
    margin-bottom: var(--hz-space-md);
  }
  @keyframes hz-spin { to { transform: rotate(360deg); } }
  .hz-auto-loading-text {
    font-size: 13px;
    color: #616161;
  }
  .hz-auto-empty {
    text-align: center;
    padding: 48px var(--hz-space-lg);
  }
  .hz-auto-empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--hz-space-md);
    color: #9ca3af;
  }
  .hz-auto-empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 var(--hz-space-xs);
  }
  .hz-auto-empty-desc {
    font-size: 13px;
    color: #616161;
    margin: 0 0 var(--hz-space-lg);
  }
`;

export default function EditAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [automation, setAutomation] = useState<AutomationFlowDto | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [status, setStatus] = useState<AutomationStatus>('draft');

  const fetchAutomation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await internalApiFetch<AutomationDetailResponse>(
        `/api/automations/${automationId}`,
        { schema: automationDetailResponseSchema },
      );

      const normalizedSteps: AutomationStep[] = (data.data.steps ?? []).map((step) => ({
        ...step,
        config: step.config ?? {},
      }));

      setAutomation({ ...data.data, steps: normalizedSteps });
      setName(data.data.name);
      setDescription(data.data.description || '');
      setSteps(normalizedSteps);
      setStatus(data.data.status);
      return;
    } catch (error) {
      setAutomation(null);
      setError(error instanceof Error ? error.message : 'Failed to load automation');
    } finally {
      setLoading(false);
    }
  }, [automationId]);

  // Fetch automation
  useEffect(() => {
    void fetchAutomation();
  }, [fetchAutomation]);

  // Save automation
  const saveAutomation = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your automation');
      return;
    }

    if (steps.length === 0) {
      setError('Please add at least one step to your automation');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = await internalApiFetch<AutomationDetailResponse>(`/api/automations/${automationId}`, {
        method: 'PUT',
        body: {
          name,
          description: description || undefined,
          steps,
          status,
        },
      });

      if (data.success) {
        router.push('/automations');
      } else {
        setError('Failed to save automation');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  // Delete automation
  const deleteAutomation = async () => {
    if (!confirm('Are you sure you want to delete this automation? This action cannot be undone.')) {
      return;
    }

    try {
      await internalApiFetch(`/api/automations/${automationId}`, { method: 'DELETE' });
      router.push('/automations');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete automation');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <div className="hz-automation-edit">
          <style>{hzStyles}</style>
          <div className="hz-auto-loading">
            <div className="hz-auto-spinner" />
            <p className="hz-auto-loading-text">Loading automation...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!automation && !loading) {
    const emptyTitle = error ? 'Unable to Load Automation' : 'Automation Not Found';
    const emptyDescription = error
      ? error
      : `The automation you&apos;re looking for doesn&apos;t exist or has been deleted.`;

    return (
      <ProtectedRoute requireOnboarding={false}>
        <div className="hz-automation-edit">
          <style>{hzStyles}</style>
          <div className="hz-auto-card">
            <div className="hz-auto-empty">
              <svg className="hz-auto-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="hz-auto-empty-title">{emptyTitle}</h2>
              <p className="hz-auto-empty-desc">{emptyDescription}</p>
              <div className="hz-auto-actions" style={{ justifyContent: 'center' }}>
                {error && (
                  <button className="hz-auto-btn" onClick={fetchAutomation}>
                    Retry
                  </button>
                )}
                <button className="hz-auto-btn hz-auto-btn-primary" onClick={() => router.push('/automations')}>
                  Back to Automations
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Edit Automation">
        <div className="hz-automation-edit">
          <style>{hzStyles}</style>
          
          {/* Header */}
          <div className="hz-auto-header">
            <div className="hz-auto-header-left">
              <button className="hz-auto-back" onClick={() => router.back()}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="hz-auto-title">Edit Automation</h1>
                <p className="hz-auto-subtitle">Modify your automation workflow</p>
              </div>
            </div>
            <button className="hz-auto-delete" onClick={deleteAutomation} title="Delete automation">
              <Trash2 size={18} />
            </button>
          </div>

          {/* Name & Description */}
          <div className="hz-auto-card">
            <div className="hz-auto-form-group">
              <label className="hz-auto-label">Automation Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome New Subscribers"
                className="hz-auto-input"
              />
            </div>
            <div className="hz-auto-form-group">
              <label className="hz-auto-label">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this automation does..."
                className="hz-auto-input hz-auto-textarea"
                rows={2}
              />
            </div>
            <div className="hz-auto-form-group">
              <label className="hz-auto-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AutomationStatus)}
                className="hz-auto-input hz-auto-select"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Flow Builder */}
          <div style={{ marginBottom: 'var(--hz-space-md)' }}>
            <h2 className="hz-auto-section-title">Workflow Steps</h2>
            <FlowBuilder steps={steps} onChange={setSteps} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="hz-auto-error">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="hz-auto-actions">
            <button
              className="hz-auto-btn hz-auto-btn-primary"
              onClick={saveAutomation}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className="hz-auto-btn"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
