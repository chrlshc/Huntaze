'use client';

import React, { useState } from 'react';
import { Revision } from '@/lib/db/repositories/revisionsRepository';
import { formatDistanceToNow } from 'date-fns';
import { 
  History, 
  RotateCcw, 
  Trash2, 
  Eye, 
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface RevisionHistoryProps {
  revisions: Revision[];
  loading: boolean;
  error: string | null;
  onRestore: (revisionId: string) => Promise<void>;
  onDelete: (revisionId: string) => Promise<void>;
  onPreview: (revision: Revision) => void;
  currentUserId: string;
}

export default function RevisionHistory({
  revisions,
  loading,
  error,
  onRestore,
  onDelete,
  onPreview,
  currentUserId,
}: RevisionHistoryProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRestore = async (revisionId: string) => {
    if (!confirm('Are you sure you want to restore this revision? This will create a backup of the current state.')) {
      return;
    }

    setRestoringId(revisionId);
    try {
      await onRestore(revisionId);
    } catch (error) {
      console.error('Failed to restore revision:', error);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (revisionId: string) => {
    if (!confirm('Are you sure you want to delete this revision? This action cannot be undone.')) {
      return;
    }

    setDeletingId(revisionId);
    try {
      await onDelete(revisionId);
    } catch (error) {
      console.error('Failed to delete revision:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getRevisionIcon = (description: string) => {
    if (description.includes('published')) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (description.includes('scheduled')) return <Clock className="w-4 h-4 text-blue-500" />;
    if (description.includes('restored')) return <RotateCcw className="w-4 h-4 text-orange-500" />;
    if (description.includes('backup')) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getTextPreview = (snapshot: any) => {
    const text = snapshot?.text || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Revision History</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          Loading revisions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Revision History</h3>
        </div>
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p>Error loading revisions: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Revision History</h3>
        </div>
        <div className="text-sm text-gray-500">
          {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Revisions List */}
      {revisions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No revisions yet. Changes will be automatically saved here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {revisions.map((revision, index) => (
            <div
              key={revision.id}
              className={`border rounded-lg p-4 ${
                index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Revision Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getRevisionIcon(revision.description)}
                  <span className="font-medium text-sm">
                    {revision.description}
                  </span>
                  {index === 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onPreview(revision)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Preview revision"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {index > 0 && (
                    <button
                      onClick={() => handleRestore(revision.id)}
                      disabled={restoringId === revision.id}
                      className="p-1 text-gray-400 hover:text-green-600 rounded disabled:opacity-50"
                      title="Restore this revision"
                    >
                      {restoringId === revision.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  {index > 0 && (
                    <button
                      onClick={() => handleDelete(revision.id)}
                      disabled={deletingId === revision.id}
                      className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                      title="Delete revision"
                    >
                      {deletingId === revision.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Revision Details */}
              <div className="space-y-2">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{revision.userName || 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(revision.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                  <div className="font-medium mb-1">Content Preview:</div>
                  <div className="text-xs text-gray-600 italic">
                    {getTextPreview(revision.snapshot) || 'No content preview available'}
                  </div>
                </div>

                {/* Metadata */}
                {revision.snapshot?.status && (
                  <div className="text-xs text-gray-500">
                    Status: <span className="capitalize">{revision.snapshot.status}</span>
                    {revision.snapshot.scheduledAt && (
                      <span className="ml-2">
                        • Scheduled: {new Date(revision.snapshot.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}