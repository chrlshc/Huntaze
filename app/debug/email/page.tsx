'use client';

import { useState } from 'react';

export default function EmailDebugPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/email');
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      setConfig({ error: 'Failed to fetch configuration' });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Email Debug Tool</h1>

        {/* Configuration Check */}
        <div className="bg-white dark:bg-gray-950 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
          <button
            onClick={checkConfig}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
          >
            Check Configuration
          </button>

          {config && (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          )}
        </div>

        {/* Test Email Send */}
        <div className="bg-white dark:bg-gray-950 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Send Test Email</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Email (must be verified in SES sandbox)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="charles@huntaze.com"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={loading || !email}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className={`p-4 rounded overflow-auto ${
                result.success 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>In AWS SES sandbox mode, you can only send to verified email addresses</li>
            <li>Make sure SES_FROM_EMAIL is set to a verified sender address</li>
            <li>AWS_REGION should match your SES configuration region</li>
            <li>Check AWS IAM permissions include ses:SendEmail</li>
          </ul>
        </div>
      </div>
    </div>
  );
}