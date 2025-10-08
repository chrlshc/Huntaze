"use client";

import { useMemo, useState } from 'react';

type ConversionScript = {
  id: string;
  niche: string;
  type: 'welcome' | 'ppv_tease' | 'upsell' | 'win_back' | 'tip_request';
  name: string;
  script: string;
  variants: string[];
  conversionRate?: number;
  bestTime?: string;
};

type TemplateLibraryProps = {
  scripts: ConversionScript[];
};

export default function TemplateLibrary({ scripts }: TemplateLibraryProps) {
  const grouped = useMemo(() => groupByType(scripts), [scripts]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
      alert('Impossible de copier dans le presse-papiers. Copiez manuellement.');
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Bibliothèque de scripts</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Scripts Huntaze testés en conditions réelles. Chaque bloc indique le taux de conversion moyen observé sur OnlyFans.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {Object.entries(grouped).map(([type, list]) => (
          <div key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{renderTypeLabel(type)}</p>
              <span className="text-xs text-gray-400">{list.length} scripts</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((item) => (
                <article
                  key={item.id}
                  className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500">Niche : {renderNicheLabel(item.niche)}</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{item.script}</p>
                    {item.variants?.length ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-medium text-purple-600 hover:text-purple-700">
                          Variantes ({item.variants.length})
                        </summary>
                        <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                          {item.variants.map((variant, index) => (
                            <li key={`${item.id}-variant-${index}`} className="rounded-lg bg-white/70 p-2 dark:bg-gray-900/60">
                              {variant}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {item.conversionRate ? `Conversion moyenne : ${(item.conversionRate * 100).toFixed(0)}%` : 'Conversion inconnue'}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopy(item.script, item.id)}
                      className="inline-flex items-center rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:border-purple-300 hover:bg-purple-50"
                    >
                      {copiedId === item.id ? 'Copié ✔' : 'Copier'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByType(list: ConversionScript[]) {
  return list.reduce<Record<string, ConversionScript[]>>((acc, script) => {
    if (!acc[script.type]) acc[script.type] = [];
    acc[script.type].push(script);
    return acc;
  }, {});
}

function renderTypeLabel(type: string) {
  switch (type) {
    case 'welcome':
      return 'Messages de bienvenue';
    case 'ppv_tease':
      return 'Teasing PPV';
    case 'upsell':
      return 'Upsell & VIP';
    case 'win_back':
      return 'Win-back / relance';
    case 'tip_request':
      return 'Demande de tips';
    default:
      return type;
  }
}

function renderNicheLabel(niche: string) {
  return niche.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
