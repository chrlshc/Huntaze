'use client';

/**
 * Edit Automation Page
 * Edit an existing automation workflow
 * Requirements: 1.3, 1.5
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FlowBuilder } from '@/components/automations/FlowBuilder';
import type { AutomationFlow, AutomationStep, AutomationStatus } from '@/lib/automations/types';

export default function EditAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [automation, setAutomation] = useState<AutomationFlow | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [status, setStatus] = useState<AutomationStatus>('draft');

  // Fetch automation
  useEffect(() => {
    const fetchAutomation = async () => {
      try {
        const response = await fetch(`/api/automations/${automationId}`);
        const data = await response.json();

        if (data.success) {
          setAutomation(data.data);
          setName(data.data.name);
          setDescription(data.data.description || '');
          setSteps(data.data.steps);
          setStatus(data.data.status);
        } else {
          setError(data.error || 'Automation not found');
        }
      } catch (err) {
        console.error('Error fetching automation:', err);
        setError('Failed to load automation');
      } finally {
        setLoading(false);
      }
    };

    fetchAutomation();
  }, [automationId]);

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
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          steps,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/automations');
      } else {
        setError(data.error || 'Failed to save automation');
      }
    } catch (err) {
      console.error('Error saving automation:', err);
      setError('Failed to save automation');
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
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/automations');
      } else {
        setError('Failed to delete automation');
      }
    } catch (err) {
      console.error('Error deleting automation:', err);
      setError('Failed to delete automation');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading automation...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!automation && !loading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <div className="p-6 max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Automation Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The automation you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button variant="primary" onClick={() => router.push('/automations')}>
              Back to Automations
            </Button>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Edit Automation">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Edit Automation
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Modify your automation workflow
              </p>
            </div>
            <button
              onClick={deleteAutomation}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete automation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Name & Description */}
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Automation Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome New Subscribers"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this automation does..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AutomationStatus)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Flow Builder */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Workflow Steps
            </h2>
            <FlowBuilder steps={steps} onChange={setSteps} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              onClick={saveAutomation}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
