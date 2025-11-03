'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  originalUrl: string;
  thumbnailUrl?: string;
  filename: string;
  sizeBytes: number;
}

interface MediaPickerProps {
  onSelect: (media: MediaAsset[]) => void;
  onClose: () => void;
  multiple?: boolean;
  filterType?: 'image' | 'video' | 'all';
}

export default function MediaPicker({
  onSelect,
  onClose,
  multiple = true,
  filterType = 'all',
}: MediaPickerProps) {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/content/media?${params}`, {
        headers: {
          'x-user-id': 'current-user-id', // Replace with actual user ID
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMedia(result.data.media);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMedia);
    
    if (multiple) {
      if (newSelection.has(mediaId)) {
        newSelection.delete(mediaId);
      } else {
        newSelection.add(mediaId);
      }
    } else {
      newSelection.clear();
      newSelection.add(mediaId);
    }
    
    setSelectedMedia(newSelection);
  };

  const handleConfirm = () => {
    const selected = media.filter(m => selectedMedia.has(m.id));
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Select Media</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMedia()}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : media.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No media found. Upload some media first.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                    selectedMedia.has(item.id)
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-square relative bg-gray-100">
                    {item.type === 'image' ? (
                      <Image
                        src={item.thumbnailUrl || item.originalUrl}
                        alt={item.filename}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl">🎥</div>
                      </div>
                    )}
                  </div>
                  
                  {selectedMedia.has(item.id) && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                  
                  <div className="p-2 bg-white">
                    <div className="text-xs truncate">{item.filename}</div>
                    <div className="text-xs text-gray-500">
                      {(item.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedMedia.size} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedMedia.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Insert {selectedMedia.size > 0 && `(${selectedMedia.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
