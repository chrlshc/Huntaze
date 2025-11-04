'use client';

import React, { useState } from 'react';
import { useHydrationDebug } from '@/hooks/useHydrationError';
import HydrationDiffViewer from './HydrationDiffViewer';

const HydrationDebugPanel: React.FC = () => {
  const { isEnabled, errors, errorCount, clearErrors, getErrorStats } = useHydrationDebug();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);

  if (!isEnabled || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const stats = getErrorStats();
  const selectedErrorData = selectedError ? errors.find(e => e.id === selectedError) : null;

  return (
    <>
      {/* Debug Panel Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-2 rounded-full text-white font-medium shadow-lg transition-colors ${
            errorCount > 0 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          🔧 Hydration {errorCount > 0 && `(${errorCount})`}
        </button>
      </div>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Hydration Debug Panel
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Statistics */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Statistics</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <div className="flex justify-between">
                    <span>Total Errors:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolved:</span>
                    <span className="font-medium text-green-600">{stats.resolved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unresolved:</span>
                    <span className="font-medium text-red-600">{stats.unresolved}</span>
                  </div>
                </div>
              </div>

              {/* Error Types */}
              {Object.keys(stats.byType).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Error Types</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="capitalize">{type.replace('_', ' ')}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mb-6 space-y-2">
                <button
                  onClick={() => setIsDiffViewerOpen(true)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Open Diff Viewer
                </button>
                <button
                  onClick={clearErrors}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Clear All Errors
                </button>
              </div>

              {/* Error List */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Recent Errors ({errors.length})
                </h3>
                {errors.length === 0 ? (
                  <p className="text-sm text-gray-500">No hydration errors detected.</p>
                ) : (
                  <div className="space-y-2">
                    {errors.slice(0, 10).map((error) => (
                      <div
                        key={error.id}
                        className={`p-2 border rounded-md cursor-pointer transition-colors ${
                          selectedError === error.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedError(selectedError === error.id ? null : error.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded ${
                            error.errorType === 'mismatch' ? 'bg-red-100 text-red-800' :
                            error.errorType === 'timeout' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {error.errorType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 truncate">
                          {error.error.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Detail Modal */}
      {selectedErrorData && (
        <div className="fixed inset-0 z-60 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedError(null)} />
          <div className="absolute inset-4 bg-white rounded-lg shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Error Details: {selectedErrorData.id}
                </h2>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Error Message</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">
                  {selectedErrorData.error.message}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">Component Stack</h3>
                <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                  {selectedErrorData.componentStack}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">Error Stack</h3>
                <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                  {selectedErrorData.error.stack}
                </pre>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">URL</h3>
                  <p className="text-sm text-gray-700 break-all">{selectedErrorData.url}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Timestamp</h3>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedErrorData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">User Agent</h3>
                <p className="text-xs text-gray-700 break-all">{selectedErrorData.userAgent}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diff Viewer */}
      <HydrationDiffViewer
        isOpen={isDiffViewerOpen}
        onClose={() => setIsDiffViewerOpen(false)}
      />
    </>
  );
};

export default HydrationDebugPanel;