'use client';

import { useState } from 'react';
import ContentEditorWithAutoSave from './ContentEditorWithAutoSave';
import MediaPicker from './MediaPicker';

interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  originalUrl: string;
  thumbnailUrl?: string;
  filename: string;
}

interface ContentCreatorProps {
  draftId?: string;
  initialContent?: string;
  platforms?: string[];
}

export default function ContentCreator({
  draftId,
  initialContent,
  platforms = [],
}: ContentCreatorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<MediaAsset[]>([]);

  const handleMediaSelect = (media: MediaAsset[]) => {
    setAttachedMedia(prev => [...prev, ...media]);
  };

  const removeMedia = (mediaId: string) => {
    setAttachedMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  return (
    <div className="space-y-4">
      {/* Editor */}
      <ContentEditorWithAutoSave
        draftId={draftId}
        initialContent={initialContent}
        platforms={platforms}
      />

      {/* Media Attachment Section */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Attached Media</h3>
          <button
            onClick={() => setShowMediaPicker(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + Add Media
          </button>
        </div>

        {attachedMedia.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded">
            No media attached. Click "Add Media" to attach images or videos.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {attachedMedia.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                  {media.type === 'image' ? (
                    <img
                      src={media.thumbnailUrl || media.originalUrl}
                      alt={media.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl">🎥</div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeMedia(media.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs truncate mt-1">{media.filename}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Selection */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Target Platforms</h3>
        <div className="flex flex-wrap gap-2">
          {['Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn', 'YouTube'].map((platform) => (
            <label key={platform} className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                defaultChecked={platforms.includes(platform.toLowerCase())}
                className="rounded"
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
          multiple={true}
        />
      )}
    </div>
  );
}
