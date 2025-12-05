'use client';

/**
 * Automations Templates Page
 * Display pre-built automation templates for quick setup
 * Requirements: 9.4 - Pre-built automation templates
 * Feature: dashboard-ux-overhaul
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AutomationStep, TriggerType, ActionType } from '@/lib/automations/types';
import { 
  Zap, 
  MessageSquare, 
  Gift, 
  Clock, 
  UserPlus, 
  ShoppingCart,
  Bell,
  Heart,
  Star,
  ArrowRight,
  Check
} from 'lucide-react';

// Template interface
interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'engagement' | 'sales' | 'retention' | 'welcome';
  icon: React.ReactNode;
  steps: AutomationStep[];
  popularity: number; // 1-5
  estimatedTime: string;
}

// Pre-built templates
const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'welcome-new-subscriber',
    name: 'Welcome New Subscriber',
    description: 'Send a personalized welcome message when someone subscribes',
    category: 'welcome',
    icon: <UserPlus className="w-6 h-6" />,
    popularity: 5,
    estimatedTime: '2 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'new_subscriber' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Hey {{fan_name}}! 👋 Welcome to my page! I\'m so excited to have you here. Feel free to message me anytime!',
          placeholders: {}
        }
      }
    ]
  },
  {
    id: 'welcome-with-offer',
    name: 'Welcome + Special Offer',
    description: 'Welcome new subscribers with a discount on their first purchase',
    category: 'welcome',
    icon: <Gift className="w-6 h-6" />,
    popularity: 5,
    estimatedTime: '3 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'new_subscriber' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Welcome {{fan_name}}! 🎉 As a thank you for subscribing, here\'s a special offer just for you!',
          placeholders: {}
        }
      },
      {
        id: 'action-2',
        type: 'action',
        name: 'create_offer' as ActionType,
        config: { 
          discountType: 'percentage',
          discountValue: 20,
          validDays: 7
        }
      }
    ]
  },
  {
    id: 'thank-you-purchase',
    name: 'Thank You for Purchase',
    description: 'Send a thank you message after a fan makes a purchase',
    category: 'engagement',
    icon: <ShoppingCart className="w-6 h-6" />,
    popularity: 4,
    estimatedTime: '2 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'purchase_completed' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Thank you so much for your purchase {{fan_name}}! 💕 I really appreciate your support. Let me know if you have any questions!',
          placeholders: {}
        }
      },
      {
        id: 'action-2',
        type: 'action',
        name: 'add_tag' as ActionType,
        config: { tagName: 'buyer' }
      }
    ]
  },
  {
    id: 'subscription-expiring-reminder',
    name: 'Subscription Expiring Reminder',
    description: 'Remind fans when their subscription is about to expire',
    category: 'retention',
    icon: <Bell className="w-6 h-6" />,
    popularity: 5,
    estimatedTime: '3 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'subscription_expiring' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Hey {{fan_name}}! 💫 Just wanted to let you know your subscription is expiring soon. I\'d love to keep you around - I have some exciting content coming up!',
          placeholders: {}
        }
      }
    ]
  },
  {
    id: 'retention-offer',
    name: 'Retention Offer',
    description: 'Offer a discount to fans whose subscription is expiring',
    category: 'retention',
    icon: <Heart className="w-6 h-6" />,
    popularity: 4,
    estimatedTime: '3 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'subscription_expiring' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Hey {{fan_name}}! I noticed your subscription is ending soon. Here\'s a special offer to stay - I\'d hate to see you go! 💕',
          placeholders: {}
        }
      },
      {
        id: 'action-2',
        type: 'action',
        name: 'create_offer' as ActionType,
        config: { 
          discountType: 'percentage',
          discountValue: 30,
          validDays: 3
        }
      }
    ]
  },
  {
    id: 'delayed-follow-up',
    name: 'Delayed Follow-up',
    description: 'Send a follow-up message a day after someone subscribes',
    category: 'engagement',
    icon: <Clock className="w-6 h-6" />,
    popularity: 3,
    estimatedTime: '3 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'new_subscriber' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'wait' as ActionType,
        config: { duration: 1, unit: 'days' }
      },
      {
        id: 'action-2',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Hey {{fan_name}}! How are you enjoying my content so far? Let me know what you\'d like to see more of! 😊',
          placeholders: {}
        }
      }
    ]
  },
  {
    id: 'vip-tagging',
    name: 'VIP Buyer Tagging',
    description: 'Automatically tag fans who make purchases as VIP',
    category: 'sales',
    icon: <Star className="w-6 h-6" />,
    popularity: 4,
    estimatedTime: '2 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'purchase_completed' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'add_tag' as ActionType,
        config: { tagName: 'vip' }
      },
      {
        id: 'action-2',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'You\'re now a VIP {{fan_name}}! 👑 Thank you for your support. VIPs get early access to my exclusive content!',
          placeholders: {}
        }
      }
    ]
  },
  {
    id: 'message-auto-response',
    name: 'Auto-Response to Messages',
    description: 'Send an automatic response when you receive a message',
    category: 'engagement',
    icon: <MessageSquare className="w-6 h-6" />,
    popularity: 3,
    estimatedTime: '2 min',
    steps: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'message_received' as TriggerType,
        config: { conditions: {} }
      },
      {
        id: 'action-1',
        type: 'action',
        name: 'send_message' as ActionType,
        config: { 
          template: 'Thanks for your message {{fan_name}}! I\'ll get back to you as soon as I can 💕',
          placeholders: {}
        }
      }
    ]
  }
];

// Category configuration
const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: <Zap className="w-4 h-4" /> },
  { id: 'welcome', label: 'Welcome', icon: <UserPlus className="w-4 h-4" /> },
  { id: 'engagement', label: 'Engagement', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'retention', label: 'Retention', icon: <Heart className="w-4 h-4" /> },
];

export default function AutomationTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all'
    ? AUTOMATION_TEMPLATES
    : AUTOMATION_TEMPLATES.filter(t => t.category === selectedCategory);

  // Use template - navigate to new page with pre-filled data
  const useTemplate = async (template: AutomationTemplate) => {
    try {
      // Create automation from template
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          steps: template.steps,
          status: 'draft',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to edit the new automation
        router.push(`/automations/${data.data.id}`);
      } else {
        console.error('Failed to create automation:', data.error);
      }
    } catch (err) {
      console.error('Error creating automation:', err);
    }
  };

  // Render popularity stars
  const renderPopularity = (popularity: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= popularity 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <ContentPageErrorBoundary pageName="Automation Templates">
      <PageLayout
        title="Automation Templates"
        subtitle="Get started quickly with pre-built automation workflows"
        breadcrumbs={[
          { label: 'Automations', href: '/automations' },
          { label: 'Templates' }
        ]}
        actions={
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => router.push('/automations/new')}
          >
            <Zap className="w-4 h-4 mr-2" />
            Create Custom
          </Button>
        }
      >
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              {category.icon}
              {category.label}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)] hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedTemplate(template)}
              data-testid={`template-card-${template.id}`}
            >
              {/* Icon & Category */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  template.category === 'welcome' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  template.category === 'engagement' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  template.category === 'sales' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                }`}>
                  {template.icon}
                </div>
                <span className="text-xs font-medium text-[var(--color-text-sub)] capitalize">
                  {template.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-[var(--color-text-sub)] mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {renderPopularity(template.popularity)}
                  <span className="text-[var(--color-text-muted)]">
                    {template.steps.length} steps
                  </span>
                </div>
                <span className="text-[var(--color-text-muted)]">
                  ~{template.estimatedTime}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTemplate(null)}
          >
            <Card 
              className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-lg ${
                    selectedTemplate.category === 'welcome' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    selectedTemplate.category === 'engagement' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    selectedTemplate.category === 'sales' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  }`}>
                    {selectedTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[var(--color-text-main)]">
                      {selectedTemplate.name}
                    </h2>
                    <p className="text-sm text-[var(--color-text-sub)] mt-1">
                      {selectedTemplate.description}
                    </p>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--color-text-main)] mb-3">
                    Workflow Steps
                  </h3>
                  <div className="space-y-3">
                    {selectedTemplate.steps.map((step, index) => (
                      <div 
                        key={step.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--color-indigo)] text-white flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            step.type === 'trigger' 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {step.type}
                          </span>
                          <p className="text-sm text-[var(--color-text-main)] mt-1 capitalize">
                            {step.name.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => useTemplate(selectedTemplate)}
                  >
                    Use Template
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageLayout>
    </ContentPageErrorBoundary>
  );
}
