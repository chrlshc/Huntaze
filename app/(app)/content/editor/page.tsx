'use client';

/**
 * Content Editor Page
 * 
 * Implements basic editing tools and AI enhancement options.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 6.3
 */
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  Image as ImageIcon,
  Type,
  Palette,
  Crop,
  RotateCcw,
  Download,
  Save,
  Wand2,
  Sliders,
  Layers,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo
} from 'lucide-react';

// AI enhancement options
const AI_ENHANCEMENTS = [
  { id: 'enhance', label: 'Auto Enhance', icon: Wand2, description: 'Automatically improve image quality' },
  { id: 'background', label: 'Remove Background', icon: Layers, description: 'Remove or replace background' },
  { id: 'retouch', label: 'AI Retouch', icon: Sparkles, description: 'Smart skin smoothing and touch-ups' },
  { id: 'upscale', label: 'Upscale', icon: ZoomIn, description: 'Increase resolution with AI' },
];

// Basic editing tools
const EDITING_TOOLS = [
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'rotate', label: 'Rotate', icon: RotateCcw },
  { id: 'adjust', label: 'Adjust', icon: Sliders },
  { id: 'text', label: 'Add Text', icon: Type },
  { id: 'filters', label: 'Filters', icon: Palette },
];

export default function ContentEditorPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Page actions
  const PageActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" disabled={!hasImage}>
        <Undo className="h-4 w-4 mr-1" />
        Undo
      </Button>
      <Button variant="ghost" size="sm" disabled={!hasImage}>
        <Redo className="h-4 w-4 mr-1" />
        Redo
      </Button>
      <Button variant="ghost" size="sm" disabled={!hasImage}>
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
      <Button variant="primary" size="sm" disabled={!hasImage}>
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>
    </div>
  );

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Content Editor">
        <PageLayout
          title="Content Editor"
          subtitle="Edit and enhance your content with AI-powered tools"
          breadcrumbs={[
            { label: 'Content', href: '/content' },
            { label: 'Editor' }
          ]}
          actions={PageActions}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Tools */}
            <div className="lg:col-span-1 space-y-4">
              {/* Basic Tools */}
              <Card className="p-4" data-testid="basic-tools">
                <h3 className="font-semibold text-[var(--color-text-main)] mb-3">Basic Tools</h3>
                <div className="space-y-2">
                  {EDITING_TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedTool === tool.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-[var(--color-text-main)]'
                      }`}
                      data-testid={`tool-${tool.id}`}
                      disabled={!hasImage}
                    >
                      <tool.icon className="h-5 w-5" />
                      <span className="font-medium">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* AI Enhancements */}
              <Card className="p-4" data-testid="ai-enhancements">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-[var(--color-text-main)]">AI Enhancements</h3>
                </div>
                <div className="space-y-2">
                  {AI_ENHANCEMENTS.map(enhancement => (
                    <button
                      key={enhancement.id}
                      onClick={() => {
                        setIsProcessing(true);
                        setTimeout(() => setIsProcessing(false), 2000);
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                      data-testid={`ai-${enhancement.id}`}
                      disabled={!hasImage || isProcessing}
                    >
                      <enhancement.icon className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <span className="font-medium text-[var(--color-text-main)] block">{enhancement.label}</span>
                        <span className="text-xs text-[var(--color-text-sub)]">{enhancement.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Canvas Area */}
            <div className="lg:col-span-3">
              <Card className="p-6 min-h-[500px]" data-testid="editor-canvas">
                {!hasImage ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="h-12 w-12 text-[var(--color-text-muted)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">
                      No image selected
                    </h3>
                    <p className="text-[var(--color-text-sub)] mb-6 max-w-md">
                      Upload an image or select one from your content library to start editing
                    </p>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="primary"
                        onClick={() => setHasImage(true)}
                        data-testid="upload-btn"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <Button variant="ghost">
                        Browse Library
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    {/* Zoom controls */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-[var(--color-text-sub)]">100%</span>
                        <Button variant="ghost" size="sm">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      )}
                    </div>

                    {/* Canvas placeholder */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-2" />
                        <p className="text-[var(--color-text-sub)]">Image preview area</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </PageLayout>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
