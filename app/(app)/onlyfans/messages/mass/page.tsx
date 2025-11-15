'use client';

import { useState } from 'react';
import { Send, Users, MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Eye, Calendar } from 'lucide-react';

export default function OnlyFansMassMessagingPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'scheduled' | 'sent'>('compose');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('daily');

  // Mock data
  const audiences = [
    { id: 'all', name: 'All Fans', count: 1234, description: 'Send to all your subscribers', color: 'blue' },
    { id: 'vip', name: 'VIP Fans', count: 156, description: 'Your highest spending fans', color: 'purple' },
    { id: 'active', name: 'Active Fans', count: 567, description: 'Fans active in last 7 days', color: 'green' },
    { id: 'new', name: 'New Subscribers', count: 89, description: 'Subscribed in last 30 days', color: 'yellow' },
    { id: 'at-risk', name: 'At-Risk Fans', count: 45, description: 'Haven\'t engaged recently', color: 'red' },
    { id: 'high-spenders', name: 'High Spenders', count: 78, description: 'Top 10% by spending', color: 'orange' },
  ];

  const scheduledMessages = [
    {
      id: 1,
      message: 'Good morning beautiful! Hope you have an amazing day 💕',
      audience: 'All Fans',
      audienceCount: 1234,
      scheduledFor: '2025-11-15T09:00:00',
      recurring: 'daily',
      status: 'scheduled',
    },
    {
      id: 2,
      message: 'Special VIP content coming your way tonight! 🔥',
      audience: 'VIP Fans',
      audienceCount: 156,
      scheduledFor: '2025-11-15T20:00:00',
      recurring: null,
      status: 'scheduled',
    },
    {
      id: 3,
      message: 'Weekend vibes! Check out my latest content 🎉',
      audience: 'Active Fans',
      audienceCount: 567,
      scheduledFor: '2025-11-16T12:00:00',
      recurring: 'weekly',
      status: 'scheduled',
    },
  ];

  const sentMessages = [
    {
      id: 4,
      message: 'Thank you for being such amazing fans! New content dropping soon 🎉',
      audience: 'All Fans',
      audienceCount: 1234,
      sentAt: '2025-11-12T14:30:00',
      delivered: 1198,
      opened: 856,
      replied: 67,
      status: 'sent',
    },
    {
      id: 5,
      message: 'Weekend special just for my VIP members! Check it out 💎',
      audience: 'VIP Fans',
      audienceCount: 156,
      sentAt: '2025-11-10T18:00:00',
      delivered: 154,
      opened: 142,
      replied: 23,
      status: 'sent',
    },
    {
      id: 6,
      message: 'We miss you! Come back and see what\'s new 💕',
      audience: 'At-Risk Fans',
      audienceCount: 45,
      sentAt: '2025-11-08T10:00:00',
      delivered: 43,
      opened: 28,
      replied: 8,
      status: 'sent',
    },
  ];

  const templates = [
    { 
      id: 1, 
      name: 'Good Morning', 
      text: 'Good morning {{name}}! Hope you have an amazing day 💕',
      category: 'greeting'
    },
    { 
      id: 2, 
      name: 'New Content Alert', 
      text: 'Hey {{name}}! New exclusive content just dropped! Don\'t miss out 🔥',
      category: 'promotion'
    },
    { 
      id: 3, 
      name: 'Thank You', 
      text: 'Thank you {{name}} for being such an amazing {{tier}} fan! You mean the world to me ❤️',
      category: 'appreciation'
    },
    { 
      id: 4, 
      name: 'Weekend Special', 
      text: 'Weekend vibes {{name}}! Something special coming your way 🎉',
      category: 'promotion'
    },
    { 
      id: 5, 
      name: 'Re-engagement', 
      text: 'Hey {{name}}, we miss you! Come back and see what\'s new 💕',
      category: 'reengagement'
    },
    { 
      id: 6, 
      name: 'VIP Exclusive', 
      text: 'Exclusive content just for you {{name}}! You\'re one of my VIP fans 💎',
      category: 'vip'
    },
  ];

  const selectedAudienceData = audiences.find(a => a.id === selectedAudience);

  const getAudienceColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[color] || colors.blue;
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    if (scheduleDate && scheduleTime) {
      console.log('Scheduling message:', { messageText, selectedAudience, scheduleDate, scheduleTime, isRecurring, recurringFrequency });
    } else {
      console.log('Sending message immediately:', { messageText, selectedAudience });
    }
    
    setMessageText('');
    setScheduleDate('');
    setScheduleTime('');
    setIsRecurring(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const previewMessage = messageText
    .replace(/\{\{name\}\}/g, 'Sarah')
    .replace(/\{\{tier\}\}/g, 'VIP');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mass Messaging</h1>
        <p className="text-gray-600 dark:text-gray-400">Send messages to multiple fans at once</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Fans</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available to message</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Messages Sent</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2,468</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">+15% this week</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">72%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{scheduledMessages.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upcoming messages</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {(['compose', 'scheduled', 'sent'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'scheduled' && scheduledMessages.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {scheduledMessages.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'compose' && (
            <div className="space-y-6">
              {/* Audience Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Audience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audiences.map((audience) => (
                    <button
                      key={audience.id}
                      onClick={() => setSelectedAudience(audience.id)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedAudience === audience.id
                          ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-700 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{audience.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAudienceColor(audience.color)}`}>
                          {audience.count}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{audience.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Templates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setMessageText(template.text)}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{template.category}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{template.text}</p>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  💡 Use variables: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{'{{name}}'}</code>, <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{'{{tier}}'}</code>
                </p>
              </div>

              {/* Message Composer */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compose Message</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                      rows={4}
                      placeholder="Write your message here... Use {{name}} and {{tier}} for personalization"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {messageText.length}/1000 characters
                      </p>
                      {messageText.includes('{{') && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          ✓ Variables detected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Schedule Options */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Schedule Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Time (Optional)
                        </label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                        />
                      </div>
                    </div>

                    {scheduleDate && scheduleTime && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="recurring"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                          />
                          <label htmlFor="recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Make this recurring
                          </label>
                        </div>

                        {isRecurring && (
                          <select
                            value={recurringFrequency}
                            onChange={(e) => setRecurringFrequency(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {selectedAudienceData && messageText && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Preview
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAudienceColor(selectedAudienceData.color)}`}>
                          {selectedAudienceData.count} recipients
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Sending to: <span className="font-medium">{selectedAudienceData.name}</span>
                      </p>
                      {scheduleDate && scheduleTime && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Scheduled for: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                          {isRecurring && <span className="ml-2 text-yellow-600 dark:text-yellow-400">({recurringFrequency})</span>}
                        </p>
                      )}
                      <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{previewMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setMessageText('');
                        setScheduleDate('');
                        setScheduleTime('');
                        setIsRecurring(false);
                      }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || !selectedAudience}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-gray-900 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      {scheduleDate && scheduleTime ? 'Schedule Message' : 'Send Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Messages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{scheduledMessages.length} messages</p>
              </div>
              {scheduledMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(message.status)}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(message.scheduledFor).toLocaleString()}
                        </span>
                        {message.recurring && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {message.recurring}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white mb-2">{message.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        To: <span className="font-medium">{message.audience}</span> ({message.audienceCount} fans)
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sent Messages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{sentMessages.length} messages</p>
              </div>
              {sentMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(message.status)}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Sent {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white mb-2">{message.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        To: <span className="font-medium">{message.audience}</span> ({message.audienceCount} fans)
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{message.delivered}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">delivered</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{message.opened}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">opened</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{message.replied}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">replied</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {((message.opened / message.delivered) * 100).toFixed(1)}%
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">open rate</span>
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-4">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
