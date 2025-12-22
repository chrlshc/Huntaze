'use client';

import { useState } from 'react';
import { type ContentItem } from '@/hooks/useContent';
import { MediaUpload } from './MediaUpload';
import { SchedulePicker } from './SchedulePicker';
import { Button } from "@/components/ui/button";

interface ContentFormProps {
  initialData?: Partial<ContentItem>;
  onSubmit: (data: Partial<ContentItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContentFormProps) {
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: initialData?.title || '',
    text: initialData?.text || '',
    type: initialData?.type || 'image',
    platform: initialData?.platform || 'onlyfans',
    status: initialData?.status || 'draft',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    scheduledAt: initialData?.scheduledAt || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.text?.trim()) {
      newErrors.text = 'Content is required';
    }

    if (formData.status === 'scheduled' && !formData.scheduledAt) {
      newErrors.scheduledAt = 'Scheduled date is required for scheduled content';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white ${
            errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Enter content title"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      {/* Type & Platform */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="text">Text</option>
          </select>
        </div>

        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Platform *
          </label>
          <select
            id="platform"
            name="platform"
            value={formData.platform}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
          >
            <option value="onlyfans">OnlyFans</option>
            <option value="fansly">Fansly</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
      </div>

      {/* Content Text */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content *
        </label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          rows={6}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white ${
            errors.text ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Write your content here..."
          disabled={isLoading}
        />
        {errors.text && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.text}</p>
        )}
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Media Files
        </label>
        <MediaUpload
          onUploadComplete={(mediaIds) => {
            setFormData((prev) => ({ ...prev, mediaIds }));
          }}
          maxFiles={10}
          maxSizeInMB={100}
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder="e.g., Lifestyle, Fitness, Behind the Scenes"
          disabled={isLoading}
        />
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
            placeholder="Add a tag and press Enter"
            disabled={isLoading}
          />
          <Button variant="secondary" onClick={handleAddTag} disabled={isLoading} type="button">
  Add
</Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                  disabled={isLoading}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status *
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
          disabled={isLoading}
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Schedule Picker */}
      {formData.status === 'scheduled' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Schedule Publication *
          </label>
          <SchedulePicker
            value={formData.scheduledAt}
            onChange={(datetime) => {
              setFormData((prev) => ({ ...prev, scheduledAt: datetime }));
              if (errors.scheduledAt) {
                setErrors((prev) => ({ ...prev, scheduledAt: '' }));
              }
            }}
            platform={formData.platform}
            disabled={isLoading}
          />
          {errors.scheduledAt && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.scheduledAt}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading} type="button">
  Cancel
</Button>
        <Button variant="primary" disabled type="submit">
  {isLoading ? 'Saving...' : initialData?.id ? 'Update Content' : 'Create Content'}
</Button>
      </div>
    </form>
  );
}
