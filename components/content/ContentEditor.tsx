'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxCharacters,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const count = editor.storage.characterCount.characters();
      
      setCharacterCount(count);
      onChange?.(html);
      onCharacterCount?.(count);
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
          }`}
          type="button"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300 italic' : ''
          }`}
          type="button"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('strike') ? 'bg-gray-300 line-through' : ''
          }`}
          type="button"
        >
          S
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          type="button"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          type="button"
        >
          1. List
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          }`}
          type="button"
        >
          Link
        </button>
        
        {editor.isActive('link') && (
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 text-red-600"
            type="button"
          >
            Unlink
          </button>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

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
