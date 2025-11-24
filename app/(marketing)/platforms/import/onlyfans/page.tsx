'use client';

import { useState } from 'react';
import { Upload, FileText, Users, MessageSquare } from 'lucide-react';

export default function OnlyFansImportPage() {
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [resultMsg, setResultMsg] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFile = (f: File | null) => {
    setFile(f);
    setFileName(f ? f.name : '');
  };

  const doImport = async () => {
    if (!file) {
      setError('Please select an export file');
      return;
    }
    setError('');
    setImporting(true);
    setResultMsg('');
    try {
      const form = new FormData();
      form.append('file', file);
      
      // Use different endpoint based on file type
      const endpoint = file.name.endsWith('.zip') 
        ? '/api/repost/import-of-zip' 
        : '/api/repost/import-csv';
      
      const resp = await fetch(endpoint, { method: 'POST', body: form });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Import failed');
      
      // Build result message based on import type
      let msg = `Imported ${data.imported || 0} records`;
      if (data.details?.summary) {
        const s = data.details.summary;
        msg = `Import complete! ${s.totalPosts || 0} posts, ${s.totalSubscribers || 0} subscribers, ${s.totalTransactions || 0} transactions`;
        if (s.dateRange?.start && s.dateRange?.end) {
          msg += ` (${s.dateRange.start} to ${s.dateRange.end})`;
        }
      }
      
      setResultMsg(msg);
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Import OnlyFans Data</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Manual Import Process</h2>
              <span className="text-sm text-gray-500">Step {step} of 3</span>
            </div>
            
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    s <= step ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-medium">Export your data from OnlyFans</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Go to OnlyFans Settings → Privacy and Safety → Request your data
                  </p>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drop your OnlyFans export here (ZIP or CSV)</p>
                <p className="text-sm text-gray-500 mb-4">Supports full data export ZIP or individual CSV files</p>
                <input
                  type="file"
                  accept=".zip,.csv"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => handleFile((e.target.files && e.target.files[0]) || null)}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700"
                >
                  Choose File
                </label>
                {fileName && (
                  <p className="mt-2 text-sm text-gray-700">Selected: {fileName}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium"
                >
                  Continue
                </button>
                <a href="/repost" className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-lg text-center font-medium">
                  Skip to Repost Engine
                </a>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">What would you like to import?</h3>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="w-5 h-5 text-purple-600" defaultChecked disabled />
                <Users className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium">Performance, revenue & subscribers</p>
                  <p className="text-sm text-gray-600">Full data import from ZIP or CSV (earnings, posts, subscribers, transactions)</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer opacity-60">
                <input type="checkbox" className="w-5 h-5 text-purple-600" disabled />
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium">Message history</p>
                  <p className="text-sm text-gray-600">Planned: operator-assist import when available</p>
                </div>
              </label>
              
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={doImport}
                disabled={importing}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {importing ? 'Importing…' : 'Start Import'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
              <p className="text-gray-600 mb-2">{resultMsg || 'Your data has been imported.'}</p>
              <p className="text-gray-600 mb-6">When OnlyFans API is available, we\'ll sync automatically.</p>
              <a
                href="/repost"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium"
              >
                Go to Repost Engine
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This is a temporary solution. Once OnlyFans provides API access, 
            your account will automatically sync in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
