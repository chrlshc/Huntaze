'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ofIntegrationApi } from '@/src/lib/api';
import ComplianceNotice from '@/components/compliance/ComplianceNotice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OnlyFansConnectPage() {
  const router = useRouter();
  // Redirect old route to the new canonical page
  useEffect(() => {
    router.replace('/of-connect');
  }, [router]);

  return (
    <div className="mx-auto max-w-md p-6">
      <p className="text-sm text-gray-600">Redirecting to the new OnlyFans connect flow…</p>
      <p className="text-xs text-gray-500">
        If you are not redirected automatically, <Link className="underline" href="/of-connect">click here</Link>.
      </p>
    </div>
  );

  // Legacy content below (kept for reference but unreachable after redirect)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const connect = async () => {
    setError('');
    setNotice('');
    if (!username || !password) {
      setError('Please enter your OnlyFans username and password');
      return;
    }
    try {
      setLoading(true);
      await ofIntegrationApi.connect({ username, password, totp: totp || undefined });
      setNotice("OnlyFans connected. Synchronization starting…");
    } catch (e: any) {
      setError(e?.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/platforms/connect" className="text-sm text-gray-600 hover:text-gray-900">← Back</Link>
          <h1 className="text-lg font-semibold">Connect OnlyFans</h1>
          <div />
        </div>
      </header>
      <main className="max-w-xl mx-auto p-6">
        <ComplianceNotice platform="OnlyFans" />
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-4">Two options available today: import an official OnlyFans CSV for analytics, or join the waitlist for the official API.</p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-600">⚠️</span>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Limited functionality</p>
                <p>Currently, only CSV import is available. To export your data:</p>
                <ol className="list-decimal ml-4 mt-2">
                  <li>Log in to OnlyFans</li>
                  <li>Go to Settings → Statements</li>
                  <li>Export your data as CSV</li>
                  <li>Import the file here</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input type="file" id="csv-upload" accept=".csv" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNotice(`File "${file.name}" selected. CSV import will be available soon.`);
                  }
                }}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer inline-flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Click to import a CSV file</span>
                <span className="text-xs text-gray-500">or drag and drop here</span>
              </label>
            </div>
            {notice && <div className="text-green-600 text-sm">{notice}</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex items-center gap-3">
              <Link href="/platforms/import/onlyfans" className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">
                Import OF CSV
              </Link>
              <Button 
                variant="ghost" 
                disabled={waitlistLoading}
                onClick={async () => {
                  try {
                    setNotice('');
                    setError('');
                    setWaitlistLoading(true);
                    await fetch('/api/waitlist/onlyfans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    setNotice('Added to OnlyFans API waitlist. We will contact you.');
                  } catch (e: any) {
                    setError(e?.message || 'Failed to join waitlist.');
                  } finally {
                    setWaitlistLoading(false);
                  }
                }}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {waitlistLoading ? 'Joining…' : 'Join API Waitlist'}
              </Button>
            </div>
            
            <div className="opacity-50 pointer-events-none">
              <p className="text-xs text-gray-500 mb-2">Direct connection (coming soon):</p>
              <Input placeholder="OnlyFans Username" disabled />
              <Input type="password" placeholder="OnlyFans Password" disabled />
              <Button variant="primary" disabled>
                Direct connection (coming soon)
              </Button>
            </div>
            <div className="text-xs text-gray-500">After connecting, visit <Link className="underline" href="/messages/onlyfans">Messages → OnlyFans</Link> and click "Sync Now".</div>
          </div>
        </div>
      </main>
    </div>
  );
}
