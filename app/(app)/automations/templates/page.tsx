'use client';

/**
 * Automations Templates Page
 * Pre-built automation templates for common workflows
 */

import { useState, useEffect } from 'react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { PageLayout } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader2, Zap, Users, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: { type: string; config?: Record<string, unknown> };
  steps: Array<{ type: string; config: Record<string, unknown> }>;
  popularity: number;
  estimatedImpact: string;
}

const categoryIcons: Record<string, typeof Zap> = {
  engagement: Users,
  retention: TrendingUp,
  sales: DollarSign,
};

export default function AutomationTemplatesPage() {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [using, setUsing] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        const res = await fetch(`/api/automations/templates?${params}`);
        const data = await res.json();
        if (data.success) {
          setTemplates(data.data.templates);
          setCategories(data.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [selectedCategory]);

  const handleUseTemplate = async (templateId: string) => {
    setUsing(templateId);
    try {
      const res = await fetch('/api/automations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to create automation with pre-filled data
        const params = new URLSearchParams({
          fromTemplate: templateId,
          name: data.data.name,
        });
        window.location.href = `/automations/new?${params}`;
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    } finally {
      setUsing(null);
    }
  };

  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="Automation Templates">
        <PageLayout
          title="Automation Templates"
          subtitle="Browse pre-built automation templates"
          breadcrumbs={[
            { label: 'Automations', href: '/automations' },
            { label: 'Templates' },
          ]}
        >
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={24} />
          </div>
        </PageLayout>
      </ContentPageErrorBoundary>
    );
  }

  if (templates.length === 0 && selectedCategory === 'all') {
    return (
      <ContentPageErrorBoundary pageName="Automation Templates">
        <PageLayout
          title="Automation Templates"
          subtitle="Browse pre-built automation templates"
          breadcrumbs={[
            { label: 'Automations', href: '/automations' },
            { label: 'Templates' },
          ]}
        >
          <EmptyState
            variant="no-data"
            title="Templates are not available yet"
            description="We are wiring the template catalog. Create an automation manually for now."
            action={{ label: 'Create automation', onClick: () => (window.location.href = '/automations/new') }}
          />
        </PageLayout>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Automation Templates">
      <PageLayout
        title="Automation Templates"
        subtitle="Browse pre-built automation templates"
        breadcrumbs={[
          { label: 'Automations', href: '/automations' },
          { label: 'Templates' },
        ]}
      >
        {/* Category Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const Icon = categoryIcons[template.category] || Zap;
            return (
              <div
                key={template.id}
                className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    template.category === 'engagement' ? 'bg-blue-100 text-blue-600' :
                    template.category === 'retention' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{template.name}</h3>
                    <span className="text-xs text-gray-400 capitalize">{template.category}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {template.estimatedImpact}
                  </span>
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={using === template.id}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {using === template.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        Use template
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PageLayout>
    </ContentPageErrorBoundary>
  );
}
