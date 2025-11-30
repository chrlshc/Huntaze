'use client';

// TODO: Install TipTap packages to enable rich text editing
// import { useEditor, EditorContent } from '@tiptap/react';
// import StarterKit from '@tiptap/starter-kit';
// import Link from '@tiptap/extension-link';
// import Placeholder from '@tiptap/extension-placeholder';
// import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useState } from 'react';

interface ContentEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onCharacterCount?: (count: number) => void;
  placeholder?: string;
  maxCharacters?: number;
  platforms?: string[];
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
};

export default function ContentEditor({
  initialContent = '',
  onChange,
  onCharacterCount,
  placeholder = 'Start writing your content...',
  maxCharacters,
  platforms = [],
}: ContentEditorProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const [platformLimits, setPlatformLimits] = useState<Array<{ platform: string; limit: number; exceeded: boolean }>>([]);

  // TODO: Restore TipTap editor when packages are installed
  // Temporary fallback to simple textarea
  const [content, setContent] = useState(initialContent);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCharacterCount(newContent.length);
    onChange?.(newContent);
    onCharacterCount?.(newContent.length);
  };

  useEffect(() => {
    setContent(initialContent);
    setCharacterCount(initialContent.length);
  }, [initialContent]);

  // Calculate platform limits
  useEffect(() => {
    if (platforms.length > 0) {
      const limits = platforms.map(platform => ({
        platform,
        limit: PLATFORM_LIMITS[platform.toLowerCase()] || 0,
        exceeded: characterCount > (PLATFORM_LIMITS[platform.toLowerCase()] || Infinity),
      }));
      setPlatformLimits(limits);
    }
  }, [platforms, characterCount]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Temporary simple textarea - TODO: Restore TipTap editor */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxCharacters}
        className="w-full min-h-[200px] p-4 focus:outline-none resize-none"
      />
      
      {/* Character Count & Platform Limits */}
      <div className="border-t bg-gray-50 p-2 text-sm">
        <div className="flex justify-between items-center">
          <div className="text-gray-600">
            {characterCount} {maxCharacters && `/ ${maxCharacters}`} characters
          </div>
          
          {platformLimits.length > 0 && (
            <div className="flex gap-2">
              {platformLimits.map(({ platform, limit, exceeded }) => (
                <div
                  key={platform}
                  className={`px-2 py-1 rounded text-xs ${
                    exceeded
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {platform}: {characterCount}/{limit}
                  {exceeded && ' ⚠️'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
