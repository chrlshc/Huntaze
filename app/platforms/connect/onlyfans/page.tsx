'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ofIntegrationApi } from '@/src/lib/api';
import ComplianceNotice from '@/components/compliance/ComplianceNotice';

export default function OnlyFansConnectPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const connect = async () => {
    setError('');
    setNotice('');
    if (!username || !password) {
      setError('Veuillez saisir votre identifiant et mot de passe OnlyFans');
      return;
    }
    try {
      setLoading(true);
      await ofIntegrationApi.connect({ username, password, totp: totp || undefined });
      setNotice("OnlyFans connecté. La synchronisation démarre…");
    } catch (e: any) {
      setError(e?.message || 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/platforms/connect" className="text-sm text-gray-600 hover:text-gray-900">← Retour</Link>
          <h1 className="text-lg font-semibold">Connecter OnlyFans</h1>
          <div />
        </div>
      </header>
      <main className="max-w-xl mx-auto p-6">
        <ComplianceNotice platform="OnlyFans" />
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-4">Renseignez vos identifiants pour synchroniser vos revenus, abonnés et messages (lecture seule). Les réponses restent manuelles.</p>
          <div className="space-y-3">
            <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Identifiant OnlyFans" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Mot de passe OnlyFans" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Code 2FA (si activé)" value={totp} onChange={(e) => setTotp(e.target.value)} />
            {notice && <div className="text-green-600 text-sm">{notice}</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button onClick={connect} disabled={loading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
              {loading ? 'Connexion…' : 'Connecter OnlyFans'}
            </button>
            <div className="text-xs text-gray-500">Après connexion, consultez <Link className="underline" href="/messages/onlyfans">Messages → OnlyFans</Link> et cliquez sur “Sync Now”.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
