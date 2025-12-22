'use client';

/**
 * New Campaign Page - Polaris Design
 * Create a new marketing campaign
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { 
  ArrowLeft, 
  Sparkles,
  Users,
  Send
} from 'lucide-react';

type CampaignChannel = 'dm' | 'email' | 'sms' | 'push';
type CampaignGoal = 'engagement' | 'retention' | 'revenue' | 'acquisition';

export default function NewCampaignPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    name: '',
    channel: 'dm' as CampaignChannel,
    goal: 'engagement' as CampaignGoal,
    segment: 'all',
    messageBody: '',
    messageSubject: '',
    status: 'draft' as 'draft' | 'active',
  });

  const segments = [
    { value: 'all', label: 'All Fans', size: 1234 },
    { value: 'new_subscribers', label: 'New Subscribers (Last 7 days)', size: 150 },
    { value: 'vip', label: 'VIP Fans', size: 234 },
    { value: 'active', label: 'Active Fans', size: 567 },
    { value: 'at_risk', label: 'At-Risk Fans', size: 89 },
    { value: 'churned', label: 'Churned Fans', size: 45 },
  ];

  const templates = [
    { id: 'welcome', name: 'Welcome Message', body: 'Hey {{name}}! Thanks for subscribing. I post exclusive content daily...' },
    { id: 'ppv_promo', name: 'PPV Promotion', body: 'Hey {{name}}! I just posted something special for you. Check it out!' },
    { id: 'reengagement', name: 'Re-engagement', body: 'Hey {{name}}! I miss you! Come back and see what you\'ve been missing...' },
    { id: 'custom', name: 'Custom Message', body: '' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.messageBody) {
      setToastMessage('Please fill in all required fields');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToastMessage('Campaign created successfully!');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        router.push('/marketing/campaigns');
      }, 1500);
    } catch {
      setToastMessage('Failed to create campaign');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({ ...prev, messageBody: template.body }));
    }
  };

  const selectedSegment = segments.find(s => s.value === formData.segment);

  const initialFormData = useMemo(() => ({
    name: '',
    channel: 'dm' as CampaignChannel,
    goal: 'engagement' as CampaignGoal,
    segment: 'all',
    messageBody: '',
    messageSubject: '',
    status: 'draft' as 'draft' | 'active',
  }), []);

  const isDirty = useMemo(() => {
    return (
      formData.name !== initialFormData.name ||
      formData.channel !== initialFormData.channel ||
      formData.goal !== initialFormData.goal ||
      formData.segment !== initialFormData.segment ||
      formData.messageBody !== initialFormData.messageBody ||
      formData.messageSubject !== initialFormData.messageSubject ||
      formData.status !== initialFormData.status
    );
  }, [formData, initialFormData]);

  // Input styles
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E3E3E3',
    borderRadius: 8,
    background: '#fff',
    fontSize: 14,
    color: '#303030',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500 as const,
    color: '#303030',
    marginBottom: 6,
  };

  return (
    <ContentPageErrorBoundary pageName="New Campaign">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <Link 
              href="/marketing/campaigns" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                fontSize: 13, 
                color: '#616161', 
                textDecoration: 'none',
                marginBottom: 8
              }}
            >
              <ArrowLeft size={16} />
              Campaigns
            </Link>
            <h1 className="page-title">Create Campaign</h1>
            {isDirty && (
              <p className="page-meta" style={{ color: '#916A00' }}>Unsaved changes</p>
            )}
          </div>
          <div className="filter-pills">
            <button 
              className="filter-pill"
              onClick={() => router.push('/marketing/campaigns')}
            >
              Discard
            </button>
            <button 
              className="filter-pill cta-button"
              onClick={handleSubmit}
              disabled={isCreating || !isDirty}
              style={{ opacity: (isCreating || !isDirty) ? 0.5 : 1 }}
            >
              {isCreating ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="content-wrapper">
          {/* Main Layout - 2 columns on desktop */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: 16 
          }}>
            {/* Main Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Campaign Details Card */}
              <div className="p-card">
                <div className="p-card-header">
                  <h3 className="p-card-title">Campaign details</h3>
                </div>
                <div className="p-card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Campaign Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Welcome New Subscribers"
                        style={inputStyle}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Channel</label>
                        <select
                          value={formData.channel}
                          onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as CampaignChannel }))}
                          style={inputStyle}
                        >
                          <option value="dm">Direct Message</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="push">Push Notification</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Goal</label>
                        <select
                          value={formData.goal}
                          onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value as CampaignGoal }))}
                          style={inputStyle}
                        >
                          <option value="engagement">Engagement</option>
                          <option value="retention">Retention</option>
                          <option value="revenue">Revenue</option>
                          <option value="acquisition">Acquisition</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'active' }))}
                          style={inputStyle}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Audience</label>
                        <select
                          value={formData.segment}
                          onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                          style={inputStyle}
                        >
                          {segments.map(segment => (
                            <option key={segment.value} value={segment.value}>
                              {segment.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedSegment && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: 12, 
                        background: '#F3F4F6', 
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#616161'
                      }}>
                        <Users size={16} />
                        <span><strong style={{ color: '#303030' }}>{selectedSegment.size}</strong> people will receive this campaign</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Card */}
              <div className="p-card">
                <div className="p-card-header">
                  <h3 className="p-card-title">Message</h3>
                </div>
                <div className="p-card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Template (Optional)</label>
                      <select 
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select a template...</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.channel === 'email' && (
                      <div>
                        <label style={labelStyle}>Subject Line</label>
                        <input
                          type="text"
                          value={formData.messageSubject}
                          onChange={(e) => setFormData(prev => ({ ...prev, messageSubject: e.target.value }))}
                          placeholder="Enter email subject..."
                          style={inputStyle}
                        />
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>Message Body</label>
                      <textarea
                        value={formData.messageBody}
                        onChange={(e) => setFormData(prev => ({ ...prev, messageBody: e.target.value }))}
                        rows={6}
                        placeholder="Write your message... Use {{name}} for personalization"
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                        required
                      />
                      <p style={{ fontSize: 12, color: '#616161', marginTop: 6 }}>
                        Available variables: {'{{name}}'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              {formData.messageBody && (
                <div className="p-card">
                  <div className="p-card-header">
                    <h3 className="p-card-title">Preview</h3>
                  </div>
                  <div className="p-card-body">
                    <div style={{ 
                      borderRadius: 8, 
                      background: '#F3F4F6', 
                      padding: 16 
                    }}>
                      {formData.channel === 'email' && formData.messageSubject && (
                        <p style={{ 
                          marginBottom: 8, 
                          fontSize: 14, 
                          fontWeight: 600, 
                          color: '#303030' 
                        }}>
                          Subject: {formData.messageSubject}
                        </p>
                      )}
                      <p style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontSize: 14, 
                        color: '#303030',
                        margin: 0
                      }}>
                        {formData.messageBody.replace(/\{\{name\}\}/g, 'John')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div style={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            zIndex: 50,
            padding: 16,
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: toastType === 'success' ? '#008060' : '#D72C0D',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 14 }}>{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              style={{ 
                color: '#fff', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ContentPageErrorBoundary>
  );
}
