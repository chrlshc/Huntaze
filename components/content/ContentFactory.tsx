"use client";

/**
 * Content Factory Component
 *
 * Allows users to create content posting tasks for TikTok/Instagram.
 * Handles video upload to S3 and task creation via API.
 *
 * Requirements: 1.1, 7.1
 */

import React, { useState, useCallback, useRef } from "react";
import { useContentTasks, ContentPlatform, CreateContentInput } from "@/lib/hooks/useContentTasks";

interface ContentFactoryProps {
  onSuccess?: (taskIds: string[]) => void;
  onError?: (error: string) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FormState {
  platforms: ContentPlatform[];
  caption: string;
  hook: string;
  body: string;
  cta: string;
  trendLabel: string;
  scheduledAt: string;
  sourceType: "UPLOAD" | "URL";
  sourceUrl: string;
}

const initialFormState: FormState = {
  platforms: [],
  caption: "",
  hook: "",
  body: "",
  cta: "",
  trendLabel: "",
  scheduledAt: "",
  sourceType: "UPLOAD",
  sourceUrl: "",
};

export function ContentFactory({ onSuccess, onError }: ContentFactoryProps) {
  const { createTask, uploadFile, error: hookError } = useContentTasks();

  const [form, setForm] = useState<FormState>(initialFormState);
  const [file, setFile] = useState<File | null>(null);
  const [assetKey, setAssetKey] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (form.platforms.length === 0) {
      errors.platforms = "Select at least one platform";
    }

    if (!form.caption.trim()) {
      errors.caption = "Caption is required";
    } else if (form.caption.length > 2200) {
      errors.caption = "Caption must be 2200 characters or less";
    }

    if (form.sourceType === "UPLOAD" && !file && !assetKey) {
      errors.file = "Please upload a video file";
    }

    if (form.sourceType === "URL" && !form.sourceUrl.trim()) {
      errors.sourceUrl = "Video URL is required";
    }

    if (form.sourceType === "URL" && form.sourceUrl) {
      try {
        new URL(form.sourceUrl);
      } catch {
        errors.sourceUrl = "Invalid URL format";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, file, assetKey]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setValidationErrors((prev) => ({
        ...prev,
        file: "Invalid file type. Allowed: MP4, MOV, WebM",
      }));
      return;
    }

    // Validate file size (500 MB max)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setValidationErrors((prev) => ({
        ...prev,
        file: "File too large. Maximum size is 500 MB",
      }));
      return;
    }

    setFile(selectedFile);
    setValidationErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });

    // Upload file to S3
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      const key = await uploadFile(selectedFile);
      if (key) {
        setAssetKey(key);
        setUploadStatus("success");
        setUploadProgress(100);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      setUploadStatus("error");
      setValidationErrors((prev) => ({
        ...prev,
        file: "Failed to upload file. Please try again.",
      }));
    }
  }, [uploadFile]);

  const handlePlatformToggle = useCallback((platform: ContentPlatform) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }, []);

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateContentInput = {
        platforms: form.platforms,
        asset: {
          sourceType: form.sourceType,
          ...(form.sourceType === "UPLOAD" && assetKey ? { assetKey } : {}),
          ...(form.sourceType === "URL" ? { sourceUrl: form.sourceUrl } : {}),
        },
        script: {
          caption: form.caption,
          ...(form.hook ? { hook: form.hook } : {}),
          ...(form.body ? { body: form.body } : {}),
          ...(form.cta ? { cta: form.cta } : {}),
        },
        ...(form.trendLabel ? { trendLabel: form.trendLabel } : {}),
        ...(form.scheduledAt ? { scheduledAt: new Date(form.scheduledAt).toISOString() } : {}),
      };

      const result = await createTask(input);

      if (result) {
        setFeedback({
          type: "success",
          message: `Successfully created ${result.taskIds.length} task(s)`,
        });
        onSuccess?.(result.taskIds);

        // Reset form
        setForm(initialFormState);
        setFile(null);
        setAssetKey(null);
        setUploadStatus("idle");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(hookError || "Failed to create task");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setFeedback({ type: "error", message });
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, assetKey, validateForm, createTask, hookError, onSuccess, onError]);

  return (
    <div className="content-factory" data-testid="content-factory">
      <h2 className="text-xl font-semibold mb-4">Create Content</h2>

      {feedback && (
        <div
          className={`mb-4 p-3 rounded ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
          data-testid="feedback-message"
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} data-testid="content-form">
        {/* Platform Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Platforms *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.platforms.includes("TIKTOK")}
                onChange={() => handlePlatformToggle("TIKTOK")}
                data-testid="platform-tiktok"
              />
              TikTok
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.platforms.includes("INSTAGRAM")}
                onChange={() => handlePlatformToggle("INSTAGRAM")}
                data-testid="platform-instagram"
              />
              Instagram
            </label>
          </div>
          {validationErrors.platforms && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.platforms}</p>
          )}
        </div>

        {/* Source Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Video Source</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sourceType"
                value="UPLOAD"
                checked={form.sourceType === "UPLOAD"}
                onChange={() => handleInputChange("sourceType", "UPLOAD")}
                data-testid="source-upload"
              />
              Upload File
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sourceType"
                value="URL"
                checked={form.sourceType === "URL"}
                onChange={() => handleInputChange("sourceType", "URL")}
                data-testid="source-url"
              />
              Video URL
            </label>
          </div>
        </div>

        {/* File Upload */}
        {form.sourceType === "UPLOAD" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Video File *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              onChange={handleFileChange}
              disabled={uploadStatus === "uploading"}
              data-testid="file-input"
            />
            {uploadStatus === "uploading" && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded h-2">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: `${uploadProgress}%` }}
                    data-testid="upload-progress"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading...</p>
              </div>
            )}
            {uploadStatus === "success" && (
              <p className="text-green-600 text-sm mt-1" data-testid="upload-success">
                ✓ File uploaded successfully
              </p>
            )}
            {validationErrors.file && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.file}</p>
            )}
          </div>
        )}

        {/* Video URL */}
        {form.sourceType === "URL" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Video URL *</label>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(e) => handleInputChange("sourceUrl", e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full border rounded px-3 py-2"
              data-testid="source-url-input"
            />
            {validationErrors.sourceUrl && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.sourceUrl}</p>
            )}
          </div>
        )}

        {/* Caption */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Caption * ({form.caption.length}/2200)
          </label>
          <textarea
            value={form.caption}
            onChange={(e) => handleInputChange("caption", e.target.value)}
            placeholder="Write your caption..."
            rows={4}
            className="w-full border rounded px-3 py-2"
            data-testid="caption-input"
          />
          {validationErrors.caption && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.caption}</p>
          )}
        </div>

        {/* Optional Fields */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hook</label>
            <input
              type="text"
              value={form.hook}
              onChange={(e) => handleInputChange("hook", e.target.value)}
              placeholder="Attention grabber"
              className="w-full border rounded px-3 py-2"
              data-testid="hook-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Body</label>
            <input
              type="text"
              value={form.body}
              onChange={(e) => handleInputChange("body", e.target.value)}
              placeholder="Main content"
              className="w-full border rounded px-3 py-2"
              data-testid="body-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">CTA</label>
            <input
              type="text"
              value={form.cta}
              onChange={(e) => handleInputChange("cta", e.target.value)}
              placeholder="Call to action"
              className="w-full border rounded px-3 py-2"
              data-testid="cta-input"
            />
          </div>
        </div>

        {/* Trend Label */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Trend Label</label>
          <input
            type="text"
            value={form.trendLabel}
            onChange={(e) => handleInputChange("trendLabel", e.target.value)}
            placeholder="e.g., #trending"
            className="w-full border rounded px-3 py-2"
            data-testid="trend-input"
          />
        </div>

        {/* Schedule */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => handleInputChange("scheduledAt", e.target.value)}
            className="w-full border rounded px-3 py-2"
            data-testid="schedule-input"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || uploadStatus === "uploading"}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          data-testid="submit-button"
        >
          {isSubmitting ? "Creating..." : "Create Content"}
        </button>
      </form>
    </div>
  );
}

export default ContentFactory;
