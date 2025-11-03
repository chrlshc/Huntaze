'use client';

import React from 'react';
import { Revision } from '@/lib/db/repositories/revisionsRepository';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Clock, 
  FileText,
  X
} from 'lucide-react';

interface RevisionComparisonProps {
  leftRevision: Revision;
  rightRevision: Revision;
  onClose: () => void;
}

export default function RevisionComparison({
  leftRevision,
  rightRevision,
  onClose,
}: RevisionComparisonProps) {
  const leftText = leftRevision.snapshot?.text || '';
  const rightText = rightRevision.snapshot?.text || '';

  // Simple diff highlighting - could be enhanced with a proper diff library
  const highlightDifferences = (text1: string, text2: string, isLeft: boolean) => {
    const words1 = text1.split(/(\s+)/);
    const words2 = text2.split(/(\s+)/);
    
    const result: JSX.Element[] = [];
    const maxLength = Math.max(words1.length, words2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const word1 = words1[i] || '';
      const word2 = words2[i] || '';
      
      if (word1 === word2) {
        result.push(<span key={i}>{isLeft ? word1 : word2}</span>);
      } else {
        if (isLeft) {
          if (word1) {
            result.push(
              <span key={i} className="bg-red-100 text-red-800 px-1 rounded">
                {word1}
              </span>
            );
          }
        } else {
          if (word2) {
            result.push(
              <span key={i} className="bg-green-100 text-green-800 px-1 rounded">
                {word2}
              </span>
            );
          }
        }
      }
    }
    
    return result;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Revision Comparison</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="grid grid-cols-2 gap-0 h-[calc(90vh-80px)]">
          {/* Left Revision */}
          <div className="border-r border-gray-200 flex flex-col">
            <div className="bg-red-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-red-800">Previous Version</h3>
                <ArrowLeft className="w-4 h-4 text-red-600" />
              </div>
              <div className="space-y-1 text-sm text-red-700">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3" />
                  <span>{leftRevision.userName || 'Unknown User'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(leftRevision.createdAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3" />
                  <span>{leftRevision.description}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {highlightDifferences(leftText, rightText, true)}
              </div>
            </div>
          </div>

          {/* Right Revision */}
          <div className="flex flex-col">
            <div className="bg-green-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-800">Current Version</h3>
                <ArrowRight className="w-4 h-4 text-green-600" />
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3" />
                  <span>{rightRevision.userName || 'Unknown User'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(rightRevision.createdAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3" />
                  <span>{rightRevision.description}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {highlightDifferences(leftText, rightText, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Removed content</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Added content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}