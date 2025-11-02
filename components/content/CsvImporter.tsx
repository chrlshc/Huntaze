'use client';

import { useState } from 'react';
import { getAvailableColumns } from '@/lib/services/csvImporter';

interface CsvMapping {
  title: string;
  content: string;
  platforms?: string;
  tags?: string;
  category?: string;
  scheduledAt?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface CsvImporterProps {
  onImportSuccess?: (importedCount: number) => void;
  onCancel?: () => void;
}

export default function CsvImporter({ onImportSuccess, onCancel }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'result'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      
      // Extract columns
      try {
        const availableColumns = getAvailableColumns(content);
        setColumns(availableColumns);
        
        // Auto-map common column names
        const autoMapping: CsvMapping = {
          title: availableColumns.find(c => c.toLowerCase() === 'title') || '',
          content: availableColumns.find(c => c.toLowerCase() === 'content') || '',
          platforms: availableColumns.find(c => c.toLowerCase() === 'platforms'),
          tags: availableColumns.find(c => c.toLowerCase() === 'tags'),
          category: availableColumns.find(c => c.toLowerCase() === 'category'),
          scheduledAt: availableColumns.find(c => c.toLowerCase() === 'scheduledat' || c.toLowerCase() === 'scheduled_at'),
        };
        
        setMapping(autoMapping);
        setStep('mapping');
      } catch (err) {
        setError('Failed to parse CSV file');
      }
    };
    
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!mapping.title || !mapping.content) {
      setError('Please map Title and Content columns');
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const response = await fetch('/api/content/import/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvContent,
          mapping,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setValidationErrors(data.errors);
        }
        throw new Error(data.error || 'Failed to import CSV');
      }

      setImportResult(data);
      setStep('result');
      
      if (onImportSuccess) {
        onImportSuccess(data.importedCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/content/import/csv/template', '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setCsvContent('');
    setColumns([]);
    setMapping({ title: '', content: '' });
    setError(null);
    setValidationErrors([]);
    setImportResult(null);
    setStep('upload');
  };

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
              >
                Download Template
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">CSV Format Requirements:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>First row must contain column headers</li>
              <li>Required columns: title, content</li>
              <li>Optional columns: platforms, tags, category, scheduledAt</li>
              <li>Maximum 50 rows per import</li>
              <li>Use comma (,) as delimiter</li>
              <li>Wrap values with commas in quotes</li>
            </ul>
          </div>
        </>
      )}

      {step === 'mapping' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Map CSV Columns</h3>
            <p className="text-sm text-blue-700">
              Match your CSV columns to the content fields. Required fields are marked with *.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Column *
              </label>
              <select
                value={mapping.title}
                onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Column *
              </label>
              <select
                value={mapping.content}
                onChange={(e) => setMapping({ ...mapping, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platforms Column (optional)
              </label>
              <select
                value={mapping.platforms || ''}
                onChange={(e) => setMapping({ ...mapping, platforms: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags Column (optional)
              </label>
              <select
                value={mapping.tags || ''}
                onChange={(e) => setMapping({ ...mapping, tags: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Column (optional)
              </label>
              <select
                value={mapping.category || ''}
                onChange={(e) => setMapping({ ...mapping, category: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date Column (optional)
              </label>
              <select
                value={mapping.scheduledAt || ''}
                onChange={(e) => setMapping({ ...mapping, scheduledAt: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading || !mapping.title || !mapping.content}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Importing...' : 'Import Content'}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {step === 'result' && importResult && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-green-900">Import Complete</h3>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-green-800">
                    Successfully imported <strong>{importResult.importedCount}</strong> of <strong>{importResult.totalRows}</strong> content items.
                  </p>
                  {importResult.failedCount > 0 && (
                    <p className="text-sm text-orange-700">
                      {importResult.failedCount} items failed to import.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import Another File
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Import Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-sm font-medium text-orange-900 mb-2">
            Validation Errors ({validationErrors.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {validationErrors.slice(0, 10).map((err, idx) => (
              <div key={idx} className="text-sm text-orange-800">
                <strong>Row {err.row}</strong> - {err.field}: {err.message}
              </div>
            ))}
            {validationErrors.length > 10 && (
              <p className="text-sm text-orange-700 italic">
                ... and {validationErrors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
