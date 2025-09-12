"use client";

import { useState } from 'react';
import UpgradeModal from './UpgradeModal';

export default function StarterUpgradeBanner({ enforcement }: { enforcement: 'ok' | 'warn_1' | 'blocked' }) {
  const [open, setOpen] = useState(false);
  if (enforcement === 'ok') return null;

  const bg = enforcement === 'warn_1' ? 'bg-amber-50' : 'bg-red-50';
  const fg = enforcement === 'warn_1' ? 'text-amber-900' : 'text-red-900';
  const border = enforcement === 'warn_1' ? 'border-amber-200' : 'border-red-200';
  const label = enforcement === 'warn_1' ? 'Starter limit reached' : 'Starter automations blocked';

  return (
    <>
      <div className={`${bg} ${fg} border ${border} px-4 py-3 rounded-lg flex items-center justify-between`}>
        <div className="text-sm">
          <strong className="font-semibold">{label}.</strong>{' '}
          Eligible up to $2,000 GMV/month. Upgrade to keep automations running.
        </div>
        <button
          onClick={() => setOpen(true)}
          className="ml-3 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-black"
        >
          Upgrade now
        </button>
      </div>

      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

