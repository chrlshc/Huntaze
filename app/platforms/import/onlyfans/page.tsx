'use client';

import { useState } from 'react';
import { Upload, FileText, Users, MessageSquare } from 'lucide-react';

export default function OnlyFansImportPage() {
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1);

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
                <p className="text-gray-600 mb-2">Drop your export file here or click to browse</p>
                <input
                  type="file"
                  accept=".json,.csv,.zip"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700"
                >
                  Choose File
                </label>
              </div>
              
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium"
              >
                Continue Without File
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">What would you like to import?</h3>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="w-5 h-5 text-purple-600" defaultChecked />
                <Users className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium">Fans list</p>
                  <p className="text-sm text-gray-600">Import your subscriber information</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="w-5 h-5 text-purple-600" defaultChecked />
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium">Message history</p>
                  <p className="text-sm text-gray-600">Import past conversations</p>
                </div>
              </label>
              
              <button
                onClick={() => {
                  setImporting(true);
                  setTimeout(() => {
                    setImporting(false);
                    setStep(3);
                  }, 2000);
                }}
                disabled={importing}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Start Import'}
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
              <p className="text-gray-600 mb-6">
                We\'ve imported your data. When OnlyFans API is available, we\'ll sync automatically.
              </p>
              <a
                href="/dashboard"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium"
              >
                Go to Dashboard
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