'use client';

import { useState } from 'react';

interface BatchOperationsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  onOperationComplete?: () => void;
}

export default function BatchOperationsToolbar({ selectedCount, selectedIds, onOperationComplete }: BatchOperationsToolbarProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Schedule modal state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Tag modal state
  const [tags, setTags] = useState('');

  const performBatchOperation = async (operation: string, data?: any) => {
    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/content/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          contentIds: selectedIds,
          data
        })
      });

      const resultData = await response.json();

      if (response.ok) {
        setResult(resultData);
        setTimeout(() => {
          setShowScheduleModal(false);
          setShowTagModal(false);
          setShowConfirmModal(false);
          onOperationComplete?.();
        }, 2000);
      } else {
        alert(resultData.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Batch operation error:', error);
      alert('Failed to perform batch operation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = () => {
    setCurrentOperation('delete');
    setShowConfirmModal(true);
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleDuplicate = () => {
    setCurrentOperation('duplicate');
    setShowConfirmModal(true);
  };

  const handleTag = () => {
    setShowTagModal(true);
  };

  const confirmSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time');
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    performBatchOperation('schedule', { scheduledAt: scheduledAt.toISOString() });
  };

  const confirmTag = () => {
    if (!tags.trim()) {
      alert('Please enter at least one tag');
      return;
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    performBatchOperation('tag', { tags: tagArray });
  };

  const confirmOperation = () => {
    performBatchOperation(currentOperation);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-4 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{selectedCount} selected</span>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex gap-2">
            <button
              onClick={handleSchedule}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              📅 Schedule
            </button>

            <button
              onClick={handleDuplicate}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              📋 Duplicate
            </button>

            <button
              onClick={handleTag}
              disabled={processing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              🏷️ Tag
            </button>

            <button
              onClick={handleDelete}
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {processing && (
          <div className="mt-3 text-center text-sm text-gray-600">
            Processing {selectedCount} items...
          </div>
        )}

        {result && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              ✓ Operation completed: {result.successCount} successful, {result.failureCount} failed
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Schedule {selectedCount} Items</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded">
                ⚠️ All selected items will be scheduled for the same time
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={confirmSchedule}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {processing ? 'Scheduling...' : 'Schedule'}
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Tags to {selectedCount} Items</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., marketing, promotion, summer"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                💡 Tags will be added to all selected items. Existing tags will be preserved.
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={confirmTag}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
              >
                {processing ? 'Adding Tags...' : 'Add Tags'}
              </button>
              <button
                onClick={() => setShowTagModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {currentOperation === 'delete' ? 'Delete' : 'Duplicate'} {selectedCount} Items?
            </h3>
            
            <p className="text-gray-600 mb-6">
              {currentOperation === 'delete' 
                ? 'This action cannot be undone. All selected content items will be permanently deleted.'
                : `${selectedCount} new content items will be created as copies of the selected items.`
              }
            </p>

            <div className="flex gap-2">
              <button
                onClick={confirmOperation}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:bg-gray-300 ${
                  currentOperation === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
