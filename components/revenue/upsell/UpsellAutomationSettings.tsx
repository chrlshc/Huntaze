'use client';

import { useState } from 'react';
import { AutomationSettings } from '@/lib/services/revenue/types';
import { Button } from "@/components/ui/button";

interface UpsellAutomationSettingsProps {
  settings: AutomationSettings;
  onUpdate: (settings: AutomationSettings) => Promise<void>;
}

export function UpsellAutomationSettings({
  settings: initialSettings,
  onUpdate,
}: UpsellAutomationSettingsProps) {
  const [settings, setSettings] = useState<AutomationSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggleEnabled = () => {
    setSettings({ ...settings, enabled: !settings.enabled });
    setHasChanges(true);
  };

  const handleThresholdChange = (value: number) => {
    setSettings({ ...settings, autoSendThreshold: value });
    setHasChanges(true);
  };

  const handleMaxDailyChange = (value: number) => {
    setSettings({ ...settings, maxDailyUpsells: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(settings);
      setHasChanges(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setHasChanges(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Automation Settings</h2>
          <p className="text-sm text-gray-600">
            Configure automatic upsell sending based on confidence thresholds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Automation</span>
          <Button variant="primary" onClick={handleToggleEnabled} aria-checked={settings.enabled}>
  <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
</Button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Auto-Send Threshold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Auto-Send Confidence Threshold
            </label>
            <span className="text-sm font-semibold text-blue-600">
              {Math.round(settings.autoSendThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.autoSendThreshold * 100}
            onChange={(e) => handleThresholdChange(Number(e.target.value) / 100)}
            disabled={!settings.enabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: settings.enabled
                ? `linear-gradient(to right, #2563eb 0%, #2563eb ${settings.autoSendThreshold * 100}%, var(--border-subtle) ${settings.autoSendThreshold * 100}%, var(--border-subtle) 100%)`
                : undefined,
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Upsells with confidence above this threshold will be sent automatically
          </p>
        </div>

        {/* Max Daily Upsells */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Daily Upsells
          </label>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={() => handleMaxDailyChange(Math.max(1, settings.maxDailyUpsells - 1))}
              disabled={!settings.enabled || settings.maxDailyUpsells <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.maxDailyUpsells}
              onChange={(e) => handleMaxDailyChange(Number(e.target.value))}
              disabled={!settings.enabled}
              className="flex-1 px-4 py-2 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
            />
            <Button 
              variant="secondary" 
              onClick={() => handleMaxDailyChange(Math.min(100, settings.maxDailyUpsells + 1))}
              disabled={!settings.enabled || settings.maxDailyUpsells >= 100}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Limit the number of automated upsells sent per day to avoid overwhelming fans
          </p>
        </div>

        {/* Excluded Fans */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excluded Fans
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[80px]">
            {settings.excludedFans.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.excludedFans.map((fanId) => (
                  <span
                    key={fanId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                  >
                    Fan #{fanId}
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        setSettings({
                          ...settings,
                          excludedFans: settings.excludedFans.filter((id) => id !== fanId),
                        });
                        setHasChanges(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No fans excluded from automation
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Fans in this list will not receive automated upsells
          </p>
        </div>

        {/* Custom Rules Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Rules
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            {settings.customRules.length > 0 ? (
              <div className="space-y-2">
                {settings.customRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      <div className="text-xs text-gray-600">{rule.condition} → {rule.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No custom rules configured
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Advanced automation rules for specific scenarios
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-800 font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="mt-6 flex gap-3 pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
  Reset
</Button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
