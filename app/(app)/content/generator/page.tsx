'use client';

/**
 * Content Generator Page - Real AI Integration
 * 
 * This page provides actual AI-powered content generation
 * using your Azure AI system (Phi-4 for fast generation).
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { Card, Button } from '@/components/ui';
import { Sparkles, Download, RefreshCw, Wand2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface GeneratedContent {
  id: string;
  type: 'post' | 'story' | 'ppv' | 'message';
  content: string;
  tone: string;
  timestamp: Date;
}

export default function ContentGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'post' | 'story' | 'ppv' | 'message'>('post');
  const [tone, setTone] = useState('seductive');

  const generateContent = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1',
        },
        body: JSON.stringify({
          type: contentType,
          prompt,
          context: `Generate ${contentType} content for OnlyFans`,
          tone
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const newContent: GeneratedContent = {
          id: Date.now().toString(),
          type: contentType,
          content: data.content,
          tone,
          timestamp: new Date()
        };

        setGeneratedContent(prev => [newContent, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error('Content generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadContent = (content: GeneratedContent) => {
    const blob = new Blob([content.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.type}_${content.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <ShopifyPageLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-500" />
                AI Content Generator
              </h1>
              <p className="text-gray-600">Generate engaging content with Azure AI</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Sparkles className="w-4 h-4" />
              Powered by Phi-4
            </div>
          </div>

          {/* Generator Form */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <div className="flex gap-2">
                  {(['post', 'story', 'ppv', 'message'] as const).map(type => (
                    <Button
                      key={type}
                      variant={contentType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setContentType(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="seductive">Seductive</option>
                  <option value="playful">Playful</option>
                  <option value="romantic">Romantic</option>
                  <option value="mysterious">Mysterious</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what content you want to generate..."
                  className="w-full p-3 border rounded-md h-32 resize-none"
                />
              </div>

              <Button
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Content */}
          {generatedContent.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Generated Content</h2>
              {generatedContent.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {item.type}
                      </span>
                      <span>{item.tone}</span>
                      <span>{item.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadContent(item)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap">{item.content}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Tips */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific in your prompts for better results</li>
              <li>• Include details about your brand and audience</li>
              <li>• Try different tones to match your style</li>
              <li>• Use generated content as inspiration, then personalize</li>
            </ul>
          </Card>
        </div>
      </ShopifyPageLayout>
    </ProtectedRoute>
  );
}
