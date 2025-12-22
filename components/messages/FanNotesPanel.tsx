'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TailAdminButton } from '@/components/ui/tailadmin/TailAdminButton';
import './fan-notes-panel.css';

// Types
type NoteCategory = 
  | 'preferences'
  | 'interests'
  | 'personal'
  | 'purchase_behavior'
  | 'communication_style'
  | 'important';

interface FanNote {
  id: string;
  category: NoteCategory;
  content: string;
  source: 'manual' | 'ai';
  confidence?: number | null;
  createdAt: string;
}

interface FanProfile {
  fanId: string;
  fanUsername?: string | null;
  fanDisplayName?: string | null;
  totalSpent: number;
  avgOrderValue: number;
  purchaseCount: number;
  messageCount: number;
  status: 'vip' | 'active' | 'at-risk' | 'churned';
}

interface FanNotesPanelProps {
  fanId: string;
  fanName: string;
  fanUsername?: string;
  fanAvatar?: string;
  // Optional data if already loaded
  initialProfile?: FanProfile;
  initialNotes?: Record<NoteCategory, FanNote[]>;
}

const CATEGORY_CONFIG: Record<NoteCategory, { label: string; icon: string; colorClass: string }> = {
  important: { label: 'Important', icon: '⭐', colorClass: 'tailadmin-text-warning' },
  preferences: { label: 'Preferences', icon: '❤️', colorClass: 'tailadmin-text-danger' },
  interests: { label: 'Interests', icon: '🎯', colorClass: 'tailadmin-text-primary' },
  personal: { label: 'Personal', icon: '👤', colorClass: 'tailadmin-text-secondary' },
  purchase_behavior: { label: 'Purchases', icon: '💰', colorClass: 'tailadmin-text-success' },
  communication_style: { label: 'Communication style', icon: '💬', colorClass: 'tailadmin-text-info' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  vip: { label: 'VIP', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  'at-risk': { label: 'At risk', variant: 'warning' },
  churned: { label: 'Churned', variant: 'danger' },
};

export function FanNotesPanel({
  fanId,
  fanName,
  fanUsername,
  fanAvatar,
  initialProfile,
  initialNotes,
}: FanNotesPanelProps) {
  const [notes, setNotes] = useState<Record<NoteCategory, FanNote[]>>(
    initialNotes || {
      preferences: [],
      interests: [],
      personal: [],
      purchase_behavior: [],
      communication_style: [],
      important: [],
    }
  );
  const [profile, setProfile] = useState<FanProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('important');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Load notes from API
  const loadNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/fans/${fanId}/context`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to load fan notes:', error);
    }
  }, [fanId]);

  useEffect(() => {
    if (!initialNotes) {
      loadNotes();
    }
  }, [fanId, initialNotes, loadNotes]);

  // Ajouter une note
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/fans/${fanId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newNoteCategory,
          content: newNoteContent.trim(),
          fanUsername,
        }),
      });

      if (response.ok) {
        const { note } = await response.json();
        setNotes(prev => ({
          ...prev,
          [newNoteCategory]: [note, ...prev[newNoteCategory]],
        }));
        setNewNoteContent('');
        setAddingNote(false);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une note
  const handleDeleteNote = async (noteId: string, category: NoteCategory) => {
    try {
      const response = await fetch(`/api/fans/${fanId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(prev => ({
          ...prev,
          [category]: prev[category].filter(n => n.id !== noteId),
        }));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Compter le total des notes
  const totalNotes = Object.values(notes).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden tailadmin-bg-white dark:tailadmin-bg-dark">
      {/* Header with avatar, status and actions */}
      <header className="tailadmin-border-b flex-shrink-0">
        <div className="tailadmin-p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full tailadmin-bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {fanAvatar || fanName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tailadmin-text-primary truncate">{fanName}</p>
              {fanUsername && (
                <p className="text-[11px] tailadmin-text-secondary truncate">@{fanUsername}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {profile && (
              <span
                className={`tailadmin-badge tailadmin-badge-${STATUS_CONFIG[profile.status].variant}`}
              >
                {STATUS_CONFIG[profile.status].label}
              </span>
            )}
            <TailAdminButton
              variant="ghost"
              size="sm"
              onClick={() => setAddingNote(true)}
            >
              + Add note
            </TailAdminButton>
          </div>
        </div>

        {/* Quick stats */}
        {profile && (
          <div className="tailadmin-px-4 tailadmin-pb-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="tailadmin-card-stat">
                <div className="text-sm font-semibold tailadmin-text-primary">
                  ${profile.totalSpent.toFixed(0)}
                </div>
                <div className="text-[11px] tailadmin-text-secondary">Total spent</div>
              </div>
              <div className="tailadmin-card-stat">
                <div className="text-sm font-semibold tailadmin-text-primary">
                  {profile.messageCount}
                </div>
                <div className="text-[11px] tailadmin-text-secondary">Messages</div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Notes section */}
      <div className="flex-1 overflow-y-auto tailadmin-scrollbar">
        <div className="tailadmin-p-4">
          {/* Notes header */}
          <div className="flex items-center justify-between tailadmin-mb-3">
            <h3 className="tailadmin-section-title">
              Notes ({totalNotes})
            </h3>
          </div>

          {/* Formulaire d'ajout */}
          {addingNote && (
            <div className="tailadmin-mb-4 tailadmin-card-inner">
              <div className="tailadmin-form-group">
                <label className="tailadmin-label">
                  Note type
                </label>
                <select
                  value={newNoteCategory}
                  onChange={e => setNewNoteCategory(e.target.value as NoteCategory)}
                  className="tailadmin-select"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tailadmin-form-group">
                <textarea
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  placeholder="E.g. Likes outdoor photos, prefers short messages..."
                  rows={4}
                  className="tailadmin-textarea"
                />

                <div className="tailadmin-mt-3 flex items-center justify-between text-[11px] tailadmin-text-secondary">
                  <div className="flex items-center gap-1">
                    <span className="tailadmin-text-warning">💡</span>
                    <span>These notes are used by the AI to personalize responses</span>
                  </div>
                  <TailAdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingNote(false);
                      setNewNoteContent('');
                    }}
                  >
                    Cancel
                  </TailAdminButton>
                </div>

                <div className="tailadmin-mt-3 flex justify-end">
                  <TailAdminButton
                    variant="primary"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={saving || !newNoteContent.trim()}
                  >
                    {saving ? 'Saving...' : 'Save note'}
                  </TailAdminButton>
                </div>
              </div>
            </div>
          )}

          {/* Liste des notes par catégorie / empty state */}
          {totalNotes === 0 && !addingNote ? (
            <div className="tailadmin-empty-state">
              <div className="text-4xl tailadmin-mb-3">📝</div>
              <h3 className="text-sm font-semibold tailadmin-text-primary">
                No notes for this fan yet
              </h3>
              <p className="text-xs tailadmin-mt-2 tailadmin-text-secondary">
                Add notes so the AI can personalize responses.
              </p>
              <TailAdminButton
                variant="primary"
                size="sm"
                onClick={() => setAddingNote(true)}
                className="tailadmin-mt-4"
              >
                Create first note
              </TailAdminButton>
            </div>
          ) : (
            <div className="tailadmin-list-group">
              {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                const categoryNotes = notes[category as NoteCategory];
                if (categoryNotes.length === 0) return null;

                return (
                  <div key={category} className="tailadmin-mb-4">
                    <div className={`tailadmin-list-header ${config.colorClass}`}>
                      {config.icon} {config.label}
                    </div>
                    <div className="tailadmin-list-items">
                      {categoryNotes.map(note => (
                        <div
                          key={note.id}
                          className="tailadmin-list-item group"
                        >
                          <p className="pr-6 text-xs tailadmin-text-primary">{note.content}</p>
                          {note.source === 'ai' && (
                            <span 
                              className="absolute top-2 right-8 text-[11px] tailadmin-text-info" 
                              title="Detected by AI"
                            >
                              🤖
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteNote(note.id, category as NoteCategory)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 tailadmin-text-secondary hover:tailadmin-text-danger transition-opacity"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer with AI info */}
      <div className="tailadmin-p-3 tailadmin-border-t tailadmin-bg-gray-light dark:tailadmin-bg-dark-2 flex-shrink-0">
        <p className="text-[11px] tailadmin-text-secondary text-center">
          💡 These notes are used by the AI to personalize responses
        </p>
      </div>
    </div>
  );
}

export default FanNotesPanel;
