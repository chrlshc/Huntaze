'use client';

/**
 * Shopify-Style Example Page
 * 
 * This page demonstrates the OnlyFans design system with Shopify-like polish
 * using all our standardized components.
 */

import React, { useState } from 'react';
import { ShopifyStyleLayout } from '@/components/layout/ShopifyStyleLayout';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { FormInput } from '@/components/shared/FormInput';
import { CategoryPill } from '@/components/shared/CategoryPill';

export default function ShopifyStyleExamplePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setFormSubmitted(true);
    }, 1500);
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', notes: '' });
    setFormSubmitted(false);
  };

  // Example stats for dashboard cards
  const stats = [
    { label: 'Total Campaigns', value: 124, change: '+12%', trend: 'up' },
    { label: 'Active Subscribers', value: 3842, change: '+5%', trend: 'up' },
    { label: 'Engagement Rate', value: '4.7%', change: '-2%', trend: 'down' },
    { label: 'Revenue', value: '$12,847', change: '+18%', trend: 'up' },
  ];

  // Actions for header
  const actions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button size="md" variant="secondary">Settings</Button>
      <Button size="md" variant="primary">New Campaign</Button>
    </div>
  );

  return (
    <ShopifyStyleLayout
      title="Campaign Dashboard"
      subtitle="Monitor and manage your content campaigns across all platforms."
      category="Analytics"
      actions={actions}
      sidebar={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Quick Actions" accent="#4F46E5">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button fullWidth variant="primary">Create Campaign</Button>
              <Button fullWidth variant="secondary">View Reports</Button>
              <Button fullWidth variant="outline">Schedule Content</Button>
              <Button fullWidth variant="ghost">Import Data</Button>
            </div>
          </Card>
          
          <Card title="Resources" subtitle="Helpful guides and documentation">
            <ul className="resource-list">
              <li>
                <a href="#">Getting Started Guide</a>
              </li>
              <li>
                <a href="#">Campaign Best Practices</a>
              </li>
              <li>
                <a href="#">Platform API Documentation</a>
              </li>
              <li>
                <a href="#">Content Strategy Templates</a>
              </li>
            </ul>
          </Card>
        </div>
      }
    >
      {/* Stats Overview */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <Card key={index} padding="small" className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-change ${stat.trend === 'up' ? 'stat-change--up' : 'stat-change--down'}`}>
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Main Content Cards */}
      <Card
        title="Recent Campaigns" 
        category="Overview" 
        actions={
          <Button size="sm" variant="secondary">View All</Button>
        }
      >
        <div className="campaign-list">
          <div className="campaign-item">
            <div className="campaign-details">
              <div className="campaign-title">Summer Sale Promotion</div>
              <div className="campaign-meta">Created 2 days ago • Instagram</div>
            </div>
            <CategoryPill variant="success">Active</CategoryPill>
          </div>
          
          <div className="campaign-item">
            <div className="campaign-details">
              <div className="campaign-title">New Product Launch</div>
              <div className="campaign-meta">Created 5 days ago • TikTok</div>
            </div>
            <CategoryPill variant="info">Scheduled</CategoryPill>
          </div>
          
          <div className="campaign-item">
            <div className="campaign-details">
              <div className="campaign-title">Holiday Special</div>
              <div className="campaign-meta">Created 1 week ago • Instagram, TikTok</div>
            </div>
            <CategoryPill variant="draft">Draft</CategoryPill>
          </div>
          
          <div className="campaign-item">
            <div className="campaign-details">
              <div className="campaign-title">Influencer Partnership</div>
              <div className="campaign-meta">Created 2 weeks ago • Instagram</div>
            </div>
            <CategoryPill variant="success">Active</CategoryPill>
          </div>
        </div>
      </Card>
      
      {/* Form Example */}
      <Card title="Create Campaign" subtitle="Fill out the form to create a new content campaign" accent={true}>
        {formSubmitted ? (
          <div className="success-message">
            <h3>Campaign Created!</h3>
            <p>Your campaign has been successfully created. You can now manage it from your dashboard.</p>
            <Button onClick={handleReset} variant="primary">Create Another</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="campaign-form">
            <div className="form-fields">
              <FormInput
                label="Campaign Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter campaign name"
                required
              />
              
              <FormInput
                label="Contact Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
              />
              
              <FormInput
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information"
              />
            </div>
            
            <div className="form-actions">
              <Button type="button" variant="secondary">Cancel</Button>
              <Button type="submit" variant="primary" loading={isLoading}>Create Campaign</Button>
            </div>
          </form>
        )}
      </Card>
      
      {/* Footer */}
      <div className="page-footer">
        <div className="footer-content">
          <p>Need help? <a href="#">Contact support</a></p>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6B7280;
          margin-top: 4px;
        }
        
        .stat-change {
          font-size: 12px;
          font-weight: 500;
          margin-top: 8px;
        }
        
        .stat-change--up {
          color: #059669;
        }
        
        .stat-change--down {
          color: #DC2626;
        }
        
        .campaign-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .campaign-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--of-border-color, #E5E7EB);
        }
        
        .campaign-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .campaign-title {
          font-weight: 500;
          font-size: 15px;
          color: #1a1a1a;
        }
        
        .campaign-meta {
          font-size: 13px;
          color: #6B7280;
          margin-top: 2px;
        }
        
        .campaign-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }
        
        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 0;
        }
        
        .success-message h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .success-message p {
          margin-bottom: 24px;
          color: #4B5563;
          max-width: 400px;
        }
        
        .page-footer {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--of-border-color, #E5E7EB);
          text-align: center;
        }
        
        .footer-content {
          font-size: 14px;
          color: #6B7280;
        }
        
        .footer-content a {
          color: var(--of-pill-text, #4F46E5);
          text-decoration: none;
        }
        
        .resource-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .resource-list li a {
          color: var(--of-pill-text, #4F46E5);
          text-decoration: none;
          font-size: 14px;
        }
        
        .resource-list li a:hover {
          text-decoration: underline;
        }
        
        /* Responsive adjustments */
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column-reverse;
            width: 100%;
          }
          
          .form-actions button {
            width: 100%;
          }
        }
      `}</style>
    </ShopifyStyleLayout>
  );
}
