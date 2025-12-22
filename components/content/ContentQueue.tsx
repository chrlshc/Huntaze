"use client";

/**
 * Content Queue Component
 *
 * Displays content posting tasks in a table with filtering and auto-refresh.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useEffect, useCallback } from "react";
import { useContentTasks, ContentTask, ContentPlatform, ContentTaskStatus } from "@/lib/hooks/useContentTasks";

interface ContentQueueProps {
  autoRefreshInterval?: number; // Default: 5000ms (5 seconds)
  onTaskClick?: (task: ContentTask) => void;
}

const STATUS_COLORS: Record<ContentTaskStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  POSTED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const PLATFORM_ICONS: Record<ContentPlatform, string> = {
  TIKTOK: "🎵",
  INSTAGRAM: "📸",
};

export function ContentQueue({
  autoRefreshInterval = 5000,
  onTaskClick,
}: ContentQueueProps) {
  const { tasks, summary, isLoading, error, refresh } = useContentTasks({
    autoRefresh: true,
    refreshInterval: autoRefreshInterval,
  });

  const [statusFilter, setStatusFilter] = useState<ContentTaskStatus | "ALL">("ALL");
  const [platformFilter, setPlatformFilter] = useState<ContentPlatform | "ALL">("ALL");

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "ALL" && task.status !== statusFilter) {
      return false;
    }
    if (platformFilter !== "ALL" && task.platform !== platformFilter) {
      return false;
    }
    return true;
  });

  const formatDate = useCallback((dateString: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }, []);

  const truncateCaption = useCallback((caption: string | null, maxLength = 50): string => {
    if (!caption) return "-";
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + "...";
  }, []);

  return (
    <div className="content-queue" data-testid="content-queue">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Content Queue</h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50"
          data-testid="refresh-button"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-4" data-testid="summary-stats">
          <div className="bg-gray-50 p-3 rounded text-center">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {summary.byStatus.PENDING || 0}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-700">
              {summary.byStatus.PROCESSING || 0}
            </div>
            <div className="text-sm text-blue-600">Processing</div>
          </div>
          <div className="bg-green-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-green-700">
              {summary.byStatus.POSTED || 0}
            </div>
            <div className="text-sm text-green-600">Posted</div>
          </div>
          <div className="bg-red-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-red-700">
              {summary.byStatus.FAILED || 0}
            </div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4" data-testid="filters">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContentTaskStatus | "ALL")}
            className="border rounded px-3 py-1"
            data-testid="status-filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="POSTED">Posted</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as ContentPlatform | "ALL")}
            className="border rounded px-3 py-1"
            data-testid="platform-filter"
          >
            <option value="ALL">All Platforms</option>
            <option value="TIKTOK">TikTok</option>
            <option value="INSTAGRAM">Instagram</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="bg-red-100 text-red-800 p-3 rounded mb-4"
          data-testid="error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Tasks Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" data-testid="tasks-table">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3">Platform</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Caption</th>
              <th className="text-left p-3">Scheduled</th>
              <th className="text-left p-3">Posted</th>
              <th className="text-left p-3">Attempts</th>
              <th className="text-left p-3">Error</th>
            </tr>
          </thead>
          <tbody data-testid="tasks-tbody">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-500">
                  {isLoading ? "Loading..." : "No tasks found"}
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => onTaskClick?.(task)}
                  data-testid={`task-row-${task.id}`}
                >
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      {PLATFORM_ICONS[task.platform]}
                      {task.platform}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${STATUS_COLORS[task.status]}`}
                      data-testid={`status-badge-${task.id}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate" title={task.caption || undefined}>
                    {truncateCaption(task.caption)}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {formatDate(task.scheduledAt)}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {formatDate(task.postedAt)}
                  </td>
                  <td className="p-3 text-center">
                    {task.attemptCount}
                  </td>
                  <td className="p-3 text-sm text-red-600 max-w-xs truncate" title={task.errorMessage || undefined}>
                    {task.errorMessage ? truncateCaption(task.errorMessage, 30) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-sm text-gray-500 text-right" data-testid="auto-refresh-indicator">
        Auto-refreshing every {autoRefreshInterval / 1000}s
      </div>
    </div>
  );
}

export default ContentQueue;
