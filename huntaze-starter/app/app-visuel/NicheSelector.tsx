"use client";

import { useState } from 'react';

type ModelNiche = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  averagePrice: { min: number; max: number };
  topContent: string[];
  personality: string;
};

type NicheSelectorProps = {
  niches: Record<string, ModelNiche>;
  aiConfig: Record<string, unknown> | null;
  initialSelection: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function NicheSelector({ niches, aiConfig, initialSelection }: NicheSelectorProps) {
  const [selection, setSelection] = useState<string>(initialSelection);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function persist(nextNiche: string) {
    setStatus('saving');
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        ...(aiConfig || {}),
        persona: {
          ...(typeof aiConfig?.persona === 'object' ? (aiConfig?.persona as Record<string, unknown>) : {}),
          niche: nextNiche,
        },
        niches: {
          primary: nextNiche,
        },
      };
      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Impossible d’enregistrer la niche');
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Erreur inconnue');
    }
  }

  async function handleSelect(id: string) {
    setSelection(id);
    await persist(id);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Niche & personnalité AI</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Sélectionnez la niche principale du créateur pour guider le training AI (vocabulaire, offre PPV, séquences de ventes).
          </p>
        </div>
        {status === 'saving' ? <span className="text-xs text-gray-500">Sauvegarde…</span> : null}
        {status === 'saved' ? <span className="text-xs text-green-600">Enregistré ✔</span> : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {Object.values(niches).map((niche) => {
          const active = selection === niche.id;
          return (
            <button
              key={niche.id}
              type="button"
              onClick={() => void handleSelect(niche.id)}
              className={`flex h-full flex-col items-start gap-3 rounded-xl border px-4 py-4 text-left transition ${
                active
                  ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-sm dark:border-purple-500 dark:bg-purple-900/40 dark:text-purple-100'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-purple-200 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{niche.name}</span>
                {active ? (
                  <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-medium text-white">Sélectionné</span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300">{niche.description}</p>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                <span className="font-semibold">Pricing :</span> ${niche.averagePrice.min} – ${niche.averagePrice.max}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-300">
                {niche.topContent.slice(0, 3).map((item) => (
                  <span key={item} className="rounded-full bg-white/80 px-2 py-0.5 dark:bg-gray-900/60">
                    {item}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
