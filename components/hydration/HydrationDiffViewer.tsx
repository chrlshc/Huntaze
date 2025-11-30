'use client';

import React, { useState, useEffect } from 'react';
import { hydrationDebugger, HydrationMismatch } from '@/lib/utils/hydrationDebugger';
import { htmlDiffer, HtmlComparisonResult } from '@/lib/utils/htmlDiffer';
import { Button } from "@/components/ui/button";

interface HydrationDiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const HydrationDiffViewer: React.FC<HydrationDiffViewerProps> = ({ isOpen, onClose }) => {
  const [mismatches, setMismatches] = useState<HydrationMismatch[]>([]);
  const [selectedMismatch, setSelectedMismatch] = useState<HydrationMismatch | null>(null);
  const [comparisonResult, setComparisonResult] = useState<HtmlComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'diff' | 'raw'>('overview');

  useEffect(() => {
    if (!isOpen) return;

    // Load initial mismatches
    setMismatches(hydrationDebugger.getMismatches());

    // Listen for new mismatches
    const handleMismatch = (event: CustomEvent<HydrationMismatch>) => {
      setMismatches(prev => [...prev, event.detail]);
    };

    window.addEventListener('hydrationMismatch', handleMismatch as EventListener);

    return () => {
      window.removeEventListener('hydrationMismatch', handleMismatch as EventListener);
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectedMismatch && selectedMismatch.serverHTML && selectedMismatch.clientHTML) {
      const result = htmlDiffer.compareHtml(selectedMismatch.serverHTML, selectedMismatch.clientHTML);
      setComparisonResult(result);
    } else {
      setComparisonResult(null);
    }
  }, [selectedMismatch]);

  const handleSelectMismatch = (mismatch: HydrationMismatch) => {
    setSelectedMismatch(mismatch);
    setActiveTab('overview');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderDiffLine = (diff: any, index: number) => {
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'insert': return 'bg-green-100 text-green-800';
        case 'delete': return 'bg-red-100 text-red-800';
        case 'replace': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div key={index} className={`p-2 rounded border-l-4 ${getTypeColor(diff.type)} mb-2`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-sm font-medium">{diff.path}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(diff.type)}`}>
            {diff.type.toUpperCase()}
          </span>
        </div>
        
        {diff.type === 'replace' && (
          <div className="space-y-1">
            <div className="bg-red-50 p-2 rounded">
              <span className="text-xs text-red-600 font-medium">Server:</span>
              <pre className="text-sm text-red-800 mt-1 whitespace-pre-wrap break-all">
                {diff.serverValue}
              </pre>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <span className="text-xs text-green-600 font-medium">Client:</span>
              <pre className="text-sm text-green-800 mt-1 whitespace-pre-wrap break-all">
                {diff.clientValue}
              </pre>
            </div>
          </div>
        )}
        
        {diff.type === 'insert' && (
          <div className="bg-green-50 p-2 rounded">
            <span className="text-xs text-green-600 font-medium">Added:</span>
            <pre className="text-sm text-green-800 mt-1 whitespace-pre-wrap break-all">
              {diff.clientValue}
            </pre>
          </div>
        )}
        
        {diff.type === 'delete' && (
          <div className="bg-red-50 p-2 rounded">
            <span className="text-xs text-red-600 font-medium">Removed:</span>
            <pre className="text-sm text-red-800 mt-1 whitespace-pre-wrap break-all">
              {diff.serverValue}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50">
      <div className="absolute inset-4 bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Hydration Diff Viewer
          </h2>
          <Button variant="primary" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Mismatch List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  Mismatches ({mismatches.length})
                </h3>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    hydrationDebugger.clearMismatches();
                    setMismatches([]);
                    setSelectedMismatch(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
                </Button>
              </div>

              {mismatches.length === 0 ? (
                <p className="text-gray-500 text-sm">No hydration mismatches detected.</p>
              ) : (
                <div className="space-y-2">
                  {mismatches.map((mismatch) => (
                    <div
                      key={mismatch.id}
                      onClick={() => handleSelectMismatch(mismatch)}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedMismatch?.id === mismatch.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(mismatch.severity)}`}>
                          {mismatch.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(mismatch.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {mismatch.componentName || 'Unknown Component'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {mismatch.differences.length} difference(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedMismatch ? (
              <>
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-4">
                    {['overview', 'diff', 'raw'].map((tab) => (
                      <Button 
                        key={tab}
                        variant="primary" 
                        onClick={() => setActiveTab(tab as any)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Mismatch Details</h4>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">ID:</span> {selectedMismatch.id}
                            </div>
                            <div>
                              <span className="font-medium">Timestamp:</span>{' '}
                              {new Date(selectedMismatch.timestamp).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Component:</span>{' '}
                              {selectedMismatch.componentName || 'Unknown'}
                            </div>
                            <div>
                              <span className="font-medium">Severity:</span>{' '}
                              <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(selectedMismatch.severity)}`}>
                                {selectedMismatch.severity.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {comparisonResult && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Comparison Summary</h4>
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Total Differences:</span>{' '}
                                {comparisonResult.summary.totalDifferences}
                              </div>
                              <div>
                                <span className="font-medium">Identical:</span>{' '}
                                {comparisonResult.identical ? 'Yes' : 'No'}
                              </div>
                              <div>
                                <span className="font-medium">Insertions:</span>{' '}
                                {comparisonResult.summary.insertions}
                              </div>
                              <div>
                                <span className="font-medium">Deletions:</span>{' '}
                                {comparisonResult.summary.deletions}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedMismatch.differences.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Detected Differences ({selectedMismatch.differences.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedMismatch.differences.map((diff, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{diff.type}</span>
                                  <span className="text-xs text-gray-500">{diff.path}</span>
                                </div>
                                <p className="text-sm text-gray-700">{diff.description}</p>
                                {diff.serverValue && (
                                  <div className="mt-2">
                                    <span className="text-xs text-gray-600">Server:</span>
                                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                      {diff.serverValue}
                                    </pre>
                                  </div>
                                )}
                                {diff.clientValue && (
                                  <div className="mt-2">
                                    <span className="text-xs text-gray-600">Client:</span>
                                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                      {diff.clientValue}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'diff' && comparisonResult && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">HTML Differences</h4>
                      {comparisonResult.differences.length === 0 ? (
                        <p className="text-gray-500">No differences found in HTML comparison.</p>
                      ) : (
                        <div className="space-y-2">
                          {comparisonResult.differences.map((diff, index) => renderDiffLine(diff, index))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'raw' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Server HTML</h4>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {selectedMismatch.serverHTML || 'No server HTML captured'}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Client HTML</h4>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {selectedMismatch.clientHTML || 'No client HTML captured'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Select a mismatch to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HydrationDiffViewer;export {
 HydrationDiffViewer };