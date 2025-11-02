'use client';

import { useState, useCallback } from 'react';
import ContentEditor from './ContentEditor';
import { useAutoSave } from '@/hooks/useAutoSave';

interface ContentEditorWithAutoSaveProps {
  draftId?: string;
  initialContent?: string;
  platforms?: string[];
  onSaved?: (draftId: string) => void;
}

export default function ContentEditorWithAutoSave({
  draftId: initialDraftId,
  initialContent = '',
  platforms = [],
  onSaved,
}: ContentEditorWithAutoSaveProps) {
  const [draftId, setDraftId] = useState(initialDraftId);
  const [content, setContent] = useState(initialContent);

  const saveDraft = useCallback(async (data: { text: string }) => {
    const response = await fetch('/api/content/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'current-user-id', // Replace with actual user ID from auth
      },
      body: JSON.stringify({
        id: draftId,
        text: data.text,
        platforms,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save draft');
    }

    const result = await response.json();
    
    if (!draftId && result.data?.id) {
      setDraftId(result.data.id);
      onSaved?.(result.data.id);
    }
  }, [draftId, platforms, onSaved]);

  const { status, triggerSave, saveNow } = useAutoSave({
    onSave: saveDraft,
    delay: 30000, // 30 seconds
    enabled: true,
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerSave({ text: newContent });
  };

  return (
    <div className="space-y-2">
      {/* Save Status Indicator */}
      <div className="flex justify-between items-center">
        <div className="text-sm">
          {status.status === 'saving' && (
            <span className="text-blue-600">💾 Saving...</span>
          )}
          {status.status === 'saved' && (
            <span className="text-green-600">
              ✓ Saved {status.lastSaved && `at ${status.lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          {status.status === 'error' && (
            <span className="text-red-600">
              ⚠️ Error: {status.error}
            </span>
          )}
          {status.status === 'idle' && (
            <span className="text-gray-500">Auto-save enabled</span>
          )}
        </div>

        <button
          onClick={saveNow}
          disabled={status.status === 'saving'}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save Now
        </button>
      </div>

      {/* Editor */}
      <ContentEditor
        initialContent={content}
        onChange={handleContentChange}
        platforms={platforms}
      />
    </div>
  );
}
