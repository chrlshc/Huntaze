'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface ContentItem {
  id: string;
  text: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  platforms: Array<{ platform: string }>;
  media: Array<{ thumbnail_url: string }>;
}

interface ContentListProps {
  items: ContentItem[];
  onItemClick?: (item: ContentItem) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function ContentList({ items, onItemClick, onSelectionChange }: ContentListProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(items.map(item => item.id));
      setSelectedItems(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === items.length);
    onSelectionChange?.(Array.from(newSelected));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'published':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      twitter: '🐦',
      facebook: '👥',
      linkedin: '💼',
      tiktok: '🎵',
      youtube: '📺'
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  return (
    <Card className="bg-white rounded-lg border">
      {/* Header with Select All */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
          className="w-5 h-5 rounded border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700">
          {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
        </span>
        {selectedItems.size > 0 && (
          <button
            onClick={() => {
              setSelectedItems(new Set());
              setSelectAll(false);
              onSelectionChange?.([]);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Content Items */}
      <div className="divide-y">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No content items found</p>
            <p className="text-sm mt-2">Create your first content to get started</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                selectedItems.has(item.id) ? 'bg-blue-50' : ''
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => handleSelectItem(item.id)}
                className="w-5 h-5 rounded border-gray-300"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Thumbnail */}
              <div className="w-16 h-16 flex-shrink-0">
                {item.media.length > 0 ? (
                  <img
                    src={item.media[0].thumbnail_url}
                    alt="Content thumbnail"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-2xl">
                    📝
                  </div>
                )}
              </div>

              {/* Content Info */}
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {item.text}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  {item.scheduled_at && (
                    <span>📅 {format(new Date(item.scheduled_at), 'MMM d, HH:mm')}</span>
                  )}
                  {item.published_at && (
                    <span>✓ {format(new Date(item.published_at), 'MMM d, yyyy')}</span>
                  )}
                  <span>Created {format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Platforms */}
              <div className="flex gap-1">
                {item.platforms.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-lg"
                    title={p.platform}
                  >
                    {getPlatformIcon(p.platform)}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick?.(item);
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
