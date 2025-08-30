'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportFanPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('onlyfans');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const resp = await fetch('/api/crm/fans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          platform,
          handle,
          email,
          tags: tags.split(',').map(s => s.trim()).filter(Boolean),
          valueCents: value ? Math.round(parseFloat(value) * 100) : 0,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed');
      }
      router.push('/fans');
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Add a Fan</h1>
        <p className="text-gray-600 mb-6">Create a fan record in your CRM</p>

        <form onSubmit={submit} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="onlyfans">OnlyFans</option>
                <option value="fansly">Fansly</option>
                <option value="patreon">Patreon</option>
                <option value="custom">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Handle / Username</label>
              <input value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email (optional)</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value ($/mo)</label>
              <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => router.back()} className="px-5 py-2 bg-gray-200 rounded-lg">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

