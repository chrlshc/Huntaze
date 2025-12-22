'use client';

/**
 * Content Editor Page - Huntaze Monochrome Design
 * Edit and enhance content with AI-powered tools
 */
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
  Redo,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// Huntaze Design Tokens
const hzStyles = `
  .hz-editor {
    --hz-radius-card: 14px;
    --hz-radius-icon: 8px;
    --hz-space-xs: 8px;
    --hz-space-sm: 12px;
    --hz-space-md: 16px;
    --hz-space-lg: 24px;
    --hz-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
    --hz-shadow-hover: 0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06);
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--hz-space-lg);
  }
  .hz-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--hz-space-lg);
    flex-wrap: wrap;
    gap: var(--hz-space-md);
  }
  .hz-editor-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #616161;
    text-decoration: none;
    margin-bottom: var(--hz-space-xs);
    transition: color 140ms ease;
  }
  .hz-editor-back:hover { color: #303030; }
  .hz-editor-title {
    font-size: 22px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 4px;
  }
  .hz-editor-subtitle {
    font-size: 13px;
    color: #616161;
    margin: 0;
  }
  .hz-editor-actions {
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
  }
  .hz-editor-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #616161;
    cursor: pointer;
    transition: all 140ms ease;
  }
  .hz-editor-btn:hover:not(:disabled) { background: #f3f4f6; color: #303030; border-color: #d1d5db; }
  .hz-editor-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .hz-editor-btn-primary {
    background: linear-gradient(180deg, #1f1f1f, #111);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .hz-editor-btn-primary:hover:not(:disabled) { 
    background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
    border-color: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  .hz-editor-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--hz-space-lg);
  }
  @media (max-width: 900px) {
    .hz-editor-grid { grid-template-columns: 1fr; }
  }
  .hz-editor-sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--hz-space-sm);
  }
  .hz-editor-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
    padding: var(--hz-space-md);
    box-shadow: var(--hz-shadow-card);
  }
  .hz-editor-card-title {
    font-size: 14px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 var(--hz-space-sm);
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
  }
  .hz-editor-card-title svg { color: #6b7280; }
  .hz-tool-list {
    display: flex;
    flex-direction: column;
    gap: var(--hz-space-xs);
  }
  .hz-tool-btn {
    display: flex;
    align-items: center;
    gap: var(--hz-space-sm);
    padding: var(--hz-space-sm);
    border-radius: var(--hz-radius-icon);
    border: none;
    background: transparent;
    color: #616161;
    cursor: pointer;
    transition: all 140ms ease;
    text-align: left;
    width: 100%;
  }
  .hz-tool-btn:hover:not(:disabled) { background: #f3f4f6; color: #303030; }
  .hz-tool-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .hz-tool-btn.active {
    background: #111;
    color: #fff;
  }
  .hz-tool-btn.active:hover { background: #1f1f1f; }
  .hz-tool-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--hz-radius-icon);
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hz-tool-btn.active .hz-tool-icon { background: rgba(255, 255, 255, 0.15); }
  .hz-tool-label { font-size: 13px; font-weight: 500; }
  .hz-ai-btn {
    display: flex;
    align-items: flex-start;
    gap: var(--hz-space-sm);
    padding: var(--hz-space-sm);
    border-radius: var(--hz-radius-icon);
    border: none;
    background: transparent;
    color: #616161;
    cursor: pointer;
    transition: all 140ms ease;
    text-align: left;
    width: 100%;
  }
  .hz-ai-btn:hover:not(:disabled) { background: #f3f4f6; }
  .hz-ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .hz-ai-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--hz-radius-icon);
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #6b7280;
  }
  .hz-ai-content { flex: 1; }
  .hz-ai-label { font-size: 13px; font-weight: 500; color: #303030; display: block; }
  .hz-ai-desc { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .hz-ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 500;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
  }
  .hz-canvas-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
    padding: var(--hz-space-lg);
    box-shadow: var(--hz-shadow-card);
    min-height: 500px;
    display: flex;
    flex-direction: column;
  }
  .hz-canvas-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--hz-space-md);
  }
  .hz-zoom-controls {
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
  }
  .hz-zoom-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #616161;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 140ms ease;
  }
  .hz-zoom-btn:hover { background: #f3f4f6; color: #303030; }
  .hz-zoom-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
  .hz-processing {
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
    font-size: 12px;
    color: #616161;
  }
  .hz-processing-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid #e5e7eb;
    border-top-color: #303030;
    border-radius: 50%;
    animation: hz-spin 0.8s linear infinite;
  }
  @keyframes hz-spin { to { transform: rotate(360deg); } }
  .hz-canvas-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .hz-canvas-empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--hz-space-md);
    color: #9ca3af;
  }
  .hz-canvas-empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 var(--hz-space-xs);
  }
  .hz-canvas-empty-desc {
    font-size: 13px;
    color: #616161;
    margin: 0 0 var(--hz-space-lg);
    max-width: 320px;
  }
  .hz-canvas-empty-actions {
    display: flex;
    align-items: center;
    gap: var(--hz-space-sm);
  }
  .hz-canvas-preview {
    flex: 1;
    background: #f3f4f6;
    border-radius: var(--hz-radius-icon);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
  }
`;

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

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Content Editor">
        <div className="hz-editor">
          <style>{hzStyles}</style>
          
          {/* Header */}
          <div className="hz-editor-header">
            <div>
              <Link href="/content" className="hz-editor-back">
                <ArrowLeft size={16} />
                Content
              </Link>
              <h1 className="hz-editor-title">Content Editor</h1>
              <p className="hz-editor-subtitle">Edit and enhance your content with AI-powered tools</p>
            </div>
            <div className="hz-editor-actions">
              <button className="hz-editor-btn" disabled={!hasImage}>
                <Undo size={16} /> Undo
              </button>
              <button className="hz-editor-btn" disabled={!hasImage}>
                <Redo size={16} /> Redo
              </button>
              <button className="hz-editor-btn" disabled={!hasImage}>
                <Download size={16} /> Export
              </button>
              <button className="hz-editor-btn hz-editor-btn-primary" disabled={!hasImage}>
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          <div className="hz-editor-grid">
            {/* Sidebar */}
            <div className="hz-editor-sidebar">
              {/* Basic Tools */}
              <div className="hz-editor-card" data-testid="basic-tools">
                <h3 className="hz-editor-card-title">Basic Tools</h3>
                <div className="hz-tool-list">
                  {EDITING_TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`hz-tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
                      data-testid={`tool-${tool.id}`}
                      disabled={!hasImage}
                    >
                      <div className="hz-tool-icon">
                        <tool.icon size={16} />
                      </div>
                      <span className="hz-tool-label">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Enhancements */}
              <div className="hz-editor-card" data-testid="ai-enhancements">
                <h3 className="hz-editor-card-title">
                  <Sparkles size={16} /> AI Enhancements
                </h3>
                <div className="hz-tool-list">
                  {AI_ENHANCEMENTS.map(enhancement => (
                    <button
                      key={enhancement.id}
                      onClick={() => {
                        setIsProcessing(true);
                        setTimeout(() => setIsProcessing(false), 2000);
                      }}
                      className="hz-ai-btn"
                      data-testid={`ai-${enhancement.id}`}
                      disabled={!hasImage || isProcessing}
                    >
                      <div className="hz-ai-icon">
                        <enhancement.icon size={16} />
                      </div>
                      <div className="hz-ai-content">
                        <span className="hz-ai-label">{enhancement.label}</span>
                        <span className="hz-ai-desc">{enhancement.description}</span>
                        <span className="hz-ai-badge">
                          <Sparkles size={10} /> AI
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="hz-canvas-card" data-testid="editor-canvas">
              {!hasImage ? (
                <div className="hz-canvas-empty">
                  <div className="hz-canvas-empty-icon">
                    <ImageIcon size={32} />
                  </div>
                  <h3 className="hz-canvas-empty-title">No image selected</h3>
                  <p className="hz-canvas-empty-desc">
                    Upload an image or select one from your content library to start editing
                  </p>
                  <div className="hz-canvas-empty-actions">
                    <button 
                      className="hz-editor-btn hz-editor-btn-primary"
                      onClick={() => setHasImage(true)}
                      data-testid="upload-btn"
                    >
                      <ImageIcon size={16} /> Upload Image
                    </button>
                    <button className="hz-editor-btn">
                      Browse Library
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hz-canvas-controls">
                    <div className="hz-zoom-controls">
                      <button className="hz-zoom-btn">
                        <ZoomOut size={16} />
                      </button>
                      <span className="hz-zoom-label">100%</span>
                      <button className="hz-zoom-btn">
                        <ZoomIn size={16} />
                      </button>
                    </div>
                    {isProcessing && (
                      <div className="hz-processing">
                        <div className="hz-processing-spinner" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                  <div className="hz-canvas-preview">
                    <div style={{ textAlign: 'center' }}>
                      <ImageIcon size={48} />
                      <p style={{ marginTop: 8, fontSize: 13 }}>Image preview area</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
