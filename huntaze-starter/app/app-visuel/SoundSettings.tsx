"use client";

import { useMemo, useState } from 'react';

type SoundEffect = {
  id: string;
  name: string;
  description: string;
  audioUrl: string;
  category: 'sale' | 'tip' | 'message' | 'milestone';
  minAmount?: number;
};

type SoundSettingsProps = {
  sounds: SoundEffect[];
  aiConfig: Record<string, unknown> | null;
  initialEnabled: boolean;
  initialSoundId: string;
  initialVolume: number;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function SoundSettings({ sounds, aiConfig, initialEnabled, initialSoundId, initialVolume }: SoundSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [soundId, setSoundId] = useState(initialSoundId);
  const [volume, setVolume] = useState(Math.min(Math.max(initialVolume, 0), 1));
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const categories = useMemo(() => groupByCategory(sounds), [sounds]);

  async function persist(next: { enabled?: boolean; soundId?: string; volume?: number }) {
    setStatus('saving');
    setError(null);
    try {
      const payload = {
        ...(aiConfig || {}),
        ppvSounds: {
          enabled: next.enabled ?? enabled,
          soundId: next.soundId ?? soundId,
          volume: next.volume ?? volume,
        },
      };
      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Impossible de sauvegarder les paramètres');
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Erreur inconnue');
    }
  }

  async function handleToggle() {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    await persist({ enabled: nextEnabled });
  }

  async function handleSoundChange(id: string) {
    setSoundId(id);
    await persist({ soundId: id });
  }

  async function handleVolumeChange(value: number) {
    const normalized = Math.min(Math.max(value, 0), 1);
    setVolume(normalized);
    await persist({ volume: normalized });
  }

  async function handleTest() {
    const sound = sounds.find((item) => item.id === soundId);
    if (!sound) return;
    try {
      const audio = new Audio(sound.audioUrl);
      audio.volume = volume;
      await audio.play();
    } catch (err) {
      setError('Impossible de lire le son (vérifier le navigateur ou le chemin audio).');
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Effets sonores PPV</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Chaque vente déclenche un son de caisse personnalisé pour renforcer la dopamine. Les paramètres sont synchronisés avec votre compte Huntaze.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleToggle()}
          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium transition ${
            enabled ? 'border-green-500 bg-green-500/10 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'
          }`}
        >
          {enabled ? 'Activés' : 'Désactivés'}
        </button>
      </div>

      <div className="mt-5 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sélection</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{renderCategoryLabel(category)}</p>
                <div className="mt-3 space-y-2">
                  {items.map((sound) => {
                    const active = sound.id === soundId;
                    return (
                      <button
                        key={sound.id}
                        onClick={() => void handleSoundChange(sound.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                          active
                            ? 'border-purple-500 bg-white text-purple-700 shadow-sm dark:border-purple-500 dark:bg-gray-900'
                            : 'border-transparent bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        <p className="font-semibold">{sound.name}</p>
                        <p className="text-xs text-gray-500">{sound.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Volume</p>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(event) => void handleVolumeChange(Number(event.target.value) / 100)}
              className="h-1 w-full cursor-pointer rounded-full accent-purple-600"
            />
            <span className="w-10 text-sm font-medium text-gray-700 dark:text-gray-200">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => void handleTest()}
            className="inline-flex items-center rounded-lg border border-purple-200 px-3 py-2 text-xs font-medium text-purple-700 transition hover:border-purple-300 hover:bg-purple-50"
            disabled={!enabled}
          >
            Tester le son
          </button>
          {status === 'saving' ? <p className="text-xs text-gray-500">Sauvegarde…</p> : null}
          {status === 'saved' ? <p className="text-xs text-green-600">Enregistré ✔</p> : null}
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function groupByCategory(sounds: SoundEffect[]) {
  return sounds.reduce<Record<string, SoundEffect[]>>((acc, sound) => {
    if (!acc[sound.category]) acc[sound.category] = [];
    acc[sound.category].push(sound);
    return acc;
  }, {});
}

function renderCategoryLabel(category: string) {
  switch (category) {
    case 'sale':
      return 'Ventes PPV';
    case 'tip':
      return 'Tips';
    case 'milestone':
      return 'Milestones';
    case 'message':
      return 'Messages';
    default:
      return category;
  }
}
