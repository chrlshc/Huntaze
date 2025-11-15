'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Play, Pause, Send, Eye, MessageCircle, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface WelcomeTemplate {
  id: number;
  name: string;
  message: string;
  isActive: boolean;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  sentCount: number;
  openRate: number;
  replyRate: number;
  createdAt: string;
  lastModified: string;
}

export default function OnlyFansWelcomeMessagesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WelcomeTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WelcomeTemplate | null>(null);

  // Mock templates data
  const [templates, setTemplates] = useState<WelcomeTemplate[]>([
    {
      id: 1,
      name: 'Immediate Welcome',
      message: 'Hey {{name}}! 👋 Welcome to my page! I\'m so excited to have you here. Feel free to message me anytime - I love chatting with my fans! 💕',
      isActive: true,
      delay: 0,
      delayUnit: 'minutes',
      sentCount: 1234,
      openRate: 89,
      replyRate: 34,
      createdAt: '2025-10-01',
      lastModified: '2025-11-10',
    },
    {
      id: 2,
      name: '24 Hour Follow-up',
      message: 'Hi {{name}}! Just wanted to check in and see how you\'re enjoying the content so far 😊 Let me know if there\'s anything specific you\'d like to see! 🔥',
      isActive: true,
      delay: 24,
      delayUnit: 'hours',
      sentCount: 1156,
      openRate: 76,
      replyRate: 28,
      createdAt: '2025-10-01',
      lastModified: '2025-11-08',
    },
    {
      id: 3,
      name: 'Week 1 Check-in',
      message: 'Hey {{name}}! 💕 You\'ve been here for a week now! Thank you so much for your support. I have some exclusive content coming soon just for loyal fans like you! 🎉',
      isActive: true,
      delay: 7,
      delayUnit: 'days',
      sentCount: 987,
      openRate: 82,
      replyRate: 31,
      createdAt: '2025-10-05',
      lastModified: '2025-11-05',
    },
    {
      id: 4,
      name: 'VIP Upgrade Offer',
      message: 'Hi {{name}}! I noticed you\'ve been really engaged with my content 😍 Would you be interested in joining my VIP tier? You\'ll get exclusive content and priority messaging! 💎',
      isActive: false,
      delay: 14,
      delayUnit: 'days',
      sentCount: 456,
      openRate: 68,
      replyRate: 22,
      createdAt: '2025-10-15',
      lastModified: '2025-10-20',
    },
  ]);

  const [automationEnabled, setAutomationEnabled] = useState(true);

  const handleToggleTemplate = (id: number) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleDuplicateTemplate = (template: WelcomeTemplate) => {
    const newTemplate = {
      ...template,
      id: Math.max(...templates.map(t => t.id)) + 1,
      name: `${template.name} (Copy)`,
      isActive: false,
      sentCount: 0,
      openRate: 0,
      replyRate: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleTestSend = (template: WelcomeTemplate) => {
    console.log('Sending test message:', template);
    alert('Test message sent to your account!');
  };

  const totalSent = templates.reduce((sum, t) => sum + t.sentCount, 0);
  const avgOpenRate = templates.reduce((sum, t) => sum + t.openRate, 0) / templates.length;
  const avgReplyRate = templates.reduce((sum, t) => sum + t.replyRate, 0) / templates.length;
  const activeTemplates = templates.filter(t => t.isActive).length;

  const getDelayText = (delay: number, unit: string) => {
    if (delay === 0) return 'Immediately';
    return `${delay} ${unit}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Messages</h1>
            <p className="text-gray-600 dark:text-gray-400">Automate your new subscriber onboarding</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sent</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSent.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">All time</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Open Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgOpenRate.toFixed(1)}%</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">+5% from last month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Reply Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgReplyRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Engagement metric</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Templates</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTemplates}/{templates.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Currently running</p>
        </div>
      </div>

      {/* Automation Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Welcome Message Automation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically send welcome messages to new subscribers
            </p>
          </div>
          <button
            onClick={() => setAutomationEnabled(!automationEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              automationEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                automationEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {!automationEnabled && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              ⚠️ Automation is currently disabled. New subscribers will not receive welcome messages.
            </p>
          </div>
        )}
      </div>

      {/* Templates List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Message Templates</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a sequence of automated messages for new subscribers
          </p>
        </div>

        <div className="p-6">
          {templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg transition-all ${
                    template.isActive
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                        {template.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Pause className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Sent after: {getDelayText(template.delay, template.delayUnit)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{template.message}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{template.sentCount}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">sent</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-600 dark:text-green-400">{template.openRate}%</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">open rate</span>
                        </div>
                        <div>
                          <span className="font-medium text-purple-600 dark:text-purple-400">{template.replyRate}%</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">reply rate</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          Last modified: {new Date(template.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggleTemplate(template.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          template.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                        title={template.isActive ? 'Pause' : 'Activate'}
                      >
                        {template.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestSend(template)}
                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition-colors"
                        title="Test Send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowCreateModal(true);
                        }}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No welcome templates yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first welcome message template to start automating your onboarding
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingTemplate ? 'Edit Template' : 'Create Welcome Template'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  defaultValue={editingTemplate?.name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  placeholder="e.g., Immediate Welcome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  defaultValue={editingTemplate?.message}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  rows={4}
                  placeholder="Write your welcome message... Use {{name}} for personalization"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  💡 Use <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{'{{name}}'}</code> to personalize with subscriber's name
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send After
                  </label>
                  <input
                    type="number"
                    defaultValue={editingTemplate?.delay || 0}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Unit
                  </label>
                  <select
                    defaultValue={editingTemplate?.delayUnit || 'minutes'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activate"
                  defaultChecked={editingTemplate?.isActive ?? true}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label htmlFor="activate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activate this template immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors">
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Message Preview</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  This is how your message will appear to subscribers:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedTemplate.message.replace(/\{\{name\}\}/g, 'Sarah')}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Sent: {getDelayText(selectedTemplate.delay, selectedTemplate.delayUnit)} after subscription</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleTestSend(selectedTemplate)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
              >
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
