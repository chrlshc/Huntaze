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
          <p className="text-sm text-gray-600 mb-4">Import CSV uniquement pour l'instant. La connexion directe est en développement. Utilisez l'export CSV d'OnlyFans pour importer vos données.</p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-600">⚠️</span>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Fonctionnalité limitée</p>
                <p>Actuellement, seul l'import CSV est disponible. Pour exporter vos données :</p>
                <ol className="list-decimal ml-4 mt-2">
                  <li>Connectez-vous à OnlyFans</li>
                  <li>Allez dans Settings → Statements</li>
                  <li>Exportez vos données en CSV</li>
                  <li>Importez le fichier ici</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNotice(`Fichier "${file.name}" sélectionné. L'import CSV sera bientôt disponible.`);
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
                <span className="text-sm text-gray-600">Cliquez pour importer un fichier CSV</span>
                <span className="text-xs text-gray-500">ou glissez-déposez ici</span>
              </label>
            </div>
            {notice && <div className="text-green-600 text-sm">{notice}</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            
            <div className="opacity-50 pointer-events-none">
              <p className="text-xs text-gray-500 mb-2">Connexion directe (bientôt disponible) :</p>
              <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Identifiant OnlyFans" disabled />
              <input type="password" className="w-full p-3 border border-gray-300 rounded-lg mt-2" placeholder="Mot de passe OnlyFans" disabled />
              <button disabled className="w-full py-2.5 bg-gray-400 text-white rounded-lg font-medium mt-2">
                Connexion directe (à venir)
              </button>
            </div>
            <div className="text-xs text-gray-500">Après connexion, consultez <Link className="underline" href="/messages/onlyfans">Messages → OnlyFans</Link> et cliquez sur “Sync Now”.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
