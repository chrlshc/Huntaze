'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from '@/components/ui/card';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  structure: {
    text: string;
    placeholders?: Array<{ id: string; label: string; type: 'text' | 'image' | 'video' }>;
    suggestedPlatforms?: string[];
  };
  usageCount: number;
  isPublic: boolean;
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const TEMPLATE_CATEGORIES = ['announcement', 'promotion', 'story', 'educational', 'engagement', 'custom'];

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'announcement-1',
    name: 'Product Launch',
    description: 'Announce a new product or feature',
    category: 'announcement',
    structure: {
      text: '🚀 Exciting news! We\'re thrilled to announce [PRODUCT_NAME]!\n\n[PRODUCT_DESCRIPTION]\n\nAvailable now at [LINK]\n\n#ProductLaunch #Innovation #NewProduct',
      placeholders: [
        { id: 'PRODUCT_NAME', label: 'Product Name', type: 'text' },
        { id: 'PRODUCT_DESCRIPTION', label: 'Product Description', type: 'text' },
        { id: 'LINK', label: 'Product Link', type: 'text' }
      ],
      suggestedPlatforms: ['instagram', 'twitter', 'linkedin']
    },
    usageCount: 245,
    isPublic: true
  },
  {
    id: 'promotion-1',
    name: 'Limited Time Offer',
    description: 'Promote a special deal or discount',
    category: 'promotion',
    structure: {
      text: '⏰ LIMITED TIME OFFER! ⏰\n\nGet [DISCOUNT]% off [PRODUCT/SERVICE] until [END_DATE]!\n\n✨ [BENEFIT_1]\n✨ [BENEFIT_2]\n✨ [BENEFIT_3]\n\nUse code: [PROMO_CODE]\n\n[CALL_TO_ACTION]',
      placeholders: [
        { id: 'DISCOUNT', label: 'Discount Percentage', type: 'text' },
        { id: 'PRODUCT/SERVICE', label: 'Product or Service', type: 'text' },
        { id: 'END_DATE', label: 'End Date', type: 'text' },
        { id: 'BENEFIT_1', label: 'First Benefit', type: 'text' },
        { id: 'BENEFIT_2', label: 'Second Benefit', type: 'text' },
        { id: 'BENEFIT_3', label: 'Third Benefit', type: 'text' },
        { id: 'PROMO_CODE', label: 'Promo Code', type: 'text' },
        { id: 'CALL_TO_ACTION', label: 'Call to Action', type: 'text' }
      ],
      suggestedPlatforms: ['instagram', 'facebook', 'twitter']
    },
    usageCount: 189,
    isPublic: true
  },
  {
    id: 'educational-1',
    name: 'How-To Guide',
    description: 'Share educational content or tutorials',
    category: 'educational',
    structure: {
      text: '📚 How to [TOPIC]: A Quick Guide\n\n1️⃣ [STEP_1]\n2️⃣ [STEP_2]\n3️⃣ [STEP_3]\n4️⃣ [STEP_4]\n\n💡 Pro tip: [PRO_TIP]\n\nWhat\'s your experience with [TOPIC]? Share in the comments!\n\n#Tutorial #HowTo #Tips #Learning',
      placeholders: [
        { id: 'TOPIC', label: 'Topic/Subject', type: 'text' },
        { id: 'STEP_1', label: 'Step 1', type: 'text' },
        { id: 'STEP_2', label: 'Step 2', type: 'text' },
        { id: 'STEP_3', label: 'Step 3', type: 'text' },
        { id: 'STEP_4', label: 'Step 4', type: 'text' },
        { id: 'PRO_TIP', label: 'Pro Tip', type: 'text' }
      ],
      suggestedPlatforms: ['linkedin', 'instagram', 'youtube']
    },
    usageCount: 156,
    isPublic: true
  },
  {
    id: 'engagement-1',
    name: 'Question Post',
    description: 'Engage your audience with questions',
    category: 'engagement',
    structure: {
      text: '🤔 Quick question for you:\n\n[QUESTION]\n\n[CONTEXT_OR_EXPLANATION]\n\nDrop your thoughts in the comments! I\'d love to hear your perspective.\n\n#Community #Question #Engagement #Discussion',
      placeholders: [
        { id: 'QUESTION', label: 'Main Question', type: 'text' },
        { id: 'CONTEXT_OR_EXPLANATION', label: 'Context or Explanation', type: 'text' }
      ],
      suggestedPlatforms: ['instagram', 'facebook', 'linkedin', 'twitter']
    },
    usageCount: 203,
    isPublic: true
  },
  {
    id: 'story-1',
    name: 'Behind the Scenes',
    description: 'Share personal stories or behind-the-scenes content',
    category: 'story',
    structure: {
      text: '✨ Behind the scenes: [STORY_TITLE]\n\n[STORY_CONTENT]\n\n[LESSON_OR_INSIGHT]\n\nWhat\'s one behind-the-scenes moment that changed your perspective?\n\n#BehindTheScenes #Story #Journey #Authentic',
      placeholders: [
        { id: 'STORY_TITLE', label: 'Story Title', type: 'text' },
        { id: 'STORY_CONTENT', label: 'Story Content', type: 'text' },
        { id: 'LESSON_OR_INSIGHT', label: 'Lesson or Insight', type: 'text' }
      ],
      suggestedPlatforms: ['instagram', 'linkedin', 'facebook']
    },
    usageCount: 134,
    isPublic: true
  }
];

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [templates] = useState<Template[]>(BUILT_IN_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchTerm || template.name.toLowerCase().includes(searchTerm.toLowerCase()) || template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = async (template: Template) => {
    try {
      await fetch(`/api/content/templates/${template.id}/use`, { method: 'POST', headers: { 'x-user-id': 'current-user-id' } });
    } catch (error) {
      console.error('Failed to increment template usage:', error);
    }
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Choose a Template</h2>
          <Button variant="primary" onClick={onClose}>✕</Button>
        </div>

        <div className="p-4 border-b space-y-3">
          <Input 
            placeholder="Search templates..." 
            value={searchTerm} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} 
            className="w-full px-3 py-2 border rounded" 
          />
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded text-sm ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              All
            </button>
            {TEMPLATE_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded text-sm capitalize ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No templates found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">{template.category}</span>
                      <span className="text-xs text-gray-500">{template.usageCount} uses</span>
                    </div>
                  </div>
                  
                  {template.description && <p className="text-sm text-gray-600 mb-3">{template.description}</p>}
                  
                  <div className="text-xs text-gray-800 bg-gray-50 p-2 rounded mb-3 max-h-20 overflow-hidden">{template.structure.text.substring(0, 150)}...</div>
                  
                  {template.structure.suggestedPlatforms && (
                    <div className="flex gap-1 flex-wrap">
                      {template.structure.suggestedPlatforms.map(platform => (
                        <span key={platform} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">{platform}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
