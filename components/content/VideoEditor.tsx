'use client';

import { useState, useRef } from 'react';

interface VideoEditorProps {
  videoId: string;
  videoUrl: string;
  onSave: (editedVideoId: string, editedVideoUrl: string) => void;
  onCancel: () => void;
}

export default function VideoEditor({ videoId, videoUrl, onSave, onCancel }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [captions, setCaptions] = useState<Array<{ text: string; startTime: number; endTime: number }>>([]);
  const [saving, setSaving] = useState(false);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
    }
  };

  const addCaption = () => {
    setCaptions(prev => [...prev, { text: 'New caption', startTime: 0, endTime: 5 }]);
  };

  const updateCaption = (index: number, field: string, value: any) => {
    setCaptions(prev => prev.map((cap, i) => i === index ? { ...cap, [field]: value } : cap));
  };

  const removeCaption = (index: number) => {
    setCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/content/media/${videoId}/edit-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'current-user-id' },
        body: JSON.stringify({
          trim: startTime !== 0 || endTime !== duration ? { startTime, endTime } : undefined,
          captions: captions.length > 0 ? captions : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save video edits');
      const result = await response.json();
      onSave(result.data.id, result.data.url);
    } catch (error) {
      alert('Failed to save video edits');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Video</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-100">
            <video ref={videoRef} src={videoUrl} controls onLoadedMetadata={handleLoadedMetadata} className="max-w-full max-h-[60vh]" />
            
            <div className="w-full max-w-lg mt-4">
              <div className="text-sm text-gray-600 mb-2">Trim Video</div>
              <div className="flex gap-2 items-center">
                <span className="text-xs">{startTime.toFixed(1)}s</span>
                <input type="range" min="0" max={duration} step="0.1" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="flex-1" />
                <input type="range" min="0" max={duration} step="0.1" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="flex-1" />
                <span className="text-xs">{endTime.toFixed(1)}s</span>
              </div>
            </div>
          </div>

          <div className="w-80 p-4 border-l overflow-y-auto space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Captions</h3>
                <button onClick={addCaption} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">+ Add</button>
              </div>
              
              <div className="space-y-3">
                {captions.map((caption, index) => (
                  <div key={index} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Caption {index + 1}</span>
                      <button onClick={() => removeCaption(index)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                    
                    <textarea value={caption.text} onChange={(e) => updateCaption(index, 'text', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" rows={2} placeholder="Caption text" />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Start (s)</label>
                        <input type="number" value={caption.startTime} onChange={(e) => updateCaption(index, 'startTime', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" step="0.1" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">End (s)</label>
                        <input type="number" value={caption.endTime} onChange={(e) => updateCaption(index, 'endTime', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" step="0.1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50" disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Processing...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
