'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

interface ImageEditorProps {
  imageId: string;
  imageUrl: string;
  onSave: (editedImageId: string, editedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({
  imageId,
  imageUrl,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [filters, setFilters] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleFilter = (filter: string) => {
    setFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/content/media/${imageId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id', // Replace with actual user ID
        },
        body: JSON.stringify({
          rotate,
          adjustments: {
            brightness,
            contrast,
            saturation,
          },
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save edits');
      }

      const result = await response.json();
      onSave(result.data.id, result.data.url);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save edits');
    } finally {
      setSaving(false);
    }
  };

  const previewStyle = {
    filter: `
      brightness(${100 + brightness}%)
      contrast(${100 + contrast}%)
      saturate(${100 + saturation}%)
      ${filters.includes('grayscale') ? 'grayscale(100%)' : ''}
      ${filters.includes('blur') ? 'blur(5px)' : ''}
    `,
    transform: `rotate(${rotate}deg)`,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Image</h2>
          <Button variant="primary" onClick={onCancel}>
            ✕
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Preview */}
          <div className="flex-1 p-4 flex items-center justify-center bg-gray-100">
            <div className="relative max-w-full max-h-full">
              <img
                src={imageUrl}
                alt="Preview"
                style={previewStyle}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="w-80 p-4 border-l overflow-y-auto space-y-6">
            {/* Adjustments */}
            <div>
              <h3 className="font-semibold mb-3">Adjustments</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Brightness</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{brightness}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Contrast</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{contrast}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Saturation</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{saturation}</div>
                </div>
              </div>
            </div>

            {/* Rotate */}
            <div>
              <h3 className="font-semibold mb-3">Rotate</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setRotate((prev) => prev - 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  ↶ 90°
                </button>
                <button
                  onClick={() => setRotate((prev) => prev + 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  ↷ 90°
                </button>
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="font-semibold mb-3">Filters</h3>
              <div className="space-y-2">
                {['grayscale', 'blur'].map((filter) => (
                  <label key={filter} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.includes(filter)}
                      onChange={() => toggleFilter(filter)}
                      className="rounded"
                    />
                    <span className="capitalize">{filter}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setBrightness(0);
                setContrast(0);
                setSaturation(0);
                setRotate(0);
                setFilters([]);
              }}
              className="w-full px-4 py-2 border rounded hover:bg-gray-50"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
  Cancel
</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
  {saving ? 'Saving...' : 'Save Changes'}
</Button>
        </div>
      </div>
    </div>
  );
}
