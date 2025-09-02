"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Edit2, Save } from "lucide-react";

type Props = {
  fan?: { name?: string } | null;
  onPick: (text: string) => void;
  onTemplatesChange?: (templates: string[]) => void;
  className?: string;
};

function substitute(template: string, context: { name?: string }) {
  return template.replace(/\{\s*name\s*\}/gi, context.name || "there");
}

export default function QuickRepliesBar({ fan, onPick, onTemplatesChange, className = "" }: Props) {
  const [templates, setTemplates] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/ai/quick-replies', { cache: 'no-store' });
        const data = await r.json();
        const t = Array.isArray(data.templates) && data.templates.length ? data.templates : [
          "Hey {name}! Thanks for your message 💕",
          "I have a special photo set today — want a preview?",
          "You're awesome! Want to join my VIP list?",
        ];
        setTemplates(t);
        onTemplatesChange?.(t);
      } catch {}
    })();
  }, [onTemplatesChange]);

  const shown = useMemo(() => templates.slice(0, 5), [templates]);

  const handleSave = async () => {
    try {
      const arr = draft
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/ai/quick-replies', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templates: arr }) });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || arr);
        onTemplatesChange?.(data.templates || arr);
        setEditing(false);
      }
    } catch {}
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Quick replies</span>
        <button className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors duration-200" onClick={() => {
          setDraft(templates.join('\n'));
          setEditing((e) => !e);
        }}>
          {editing ? <><X className="w-3 h-3" /> Close</> : <><Edit2 className="w-3 h-3" /> Customize</>}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {shown.map((t, i) => (
          <button
            key={i}
            onClick={() => onPick(substitute(t, { name: fan?.name }))}
            className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 shadow-sm transition-all duration-200 transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            title={`Alt+${i+1} to insert, Shift+Alt+${i+1} to send`}
          >
            {substitute(t, { name: fan?.name })}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-600 font-medium">Alt+1…5 to insert, Shift+Alt to send</p>
      {editing && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm ring-1 ring-black/5">
          <p className="text-xs text-gray-600 mb-2">One template per line. Use {'{name}'} for fan name.</p>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" placeholder="Enter your quick reply templates..." />
          <div className="mt-2 flex justify-end">
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

