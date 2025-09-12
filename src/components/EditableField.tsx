"use client";

import { useState, useEffect } from 'react';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export default function EditableField({ label, value, onSave, placeholder, multiline = false }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = () => {
    const next = (draft ?? '').trim();
    onSave(next.length ? next : value);
    setEditing(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <button
          onClick={() => {
            setDraft(value);
            setEditing((prev) => !prev);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {editing ? 'Annuler' : 'Personnaliser'}
        </button>
      </div>

      {editing ? (
        <div className="mt-2 flex gap-2">
          {multiline ? (
            <textarea
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 p-2 border rounded min-h-[80px]"
            />
          ) : (
            <input
              type="text"
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
          )}
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Enregistrer
          </button>
        </div>
      ) : (
        <div className="mt-1 text-gray-800 whitespace-pre-wrap">{value}</div>
      )}
    </div>
  );
}

