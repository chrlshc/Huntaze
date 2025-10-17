"use client";

import React, { createContext, useContext, useState } from 'react';

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const TooltipCtx = createContext<Ctx | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipCtx.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex items-center">{children}</span>
    </TooltipCtx.Provider>
  );
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  const ctx = useContext(TooltipCtx);
  return (
    <span
      onMouseEnter={() => ctx?.setOpen(true)}
      onMouseLeave={() => ctx?.setOpen(false)}
      onFocus={() => ctx?.setOpen(true)}
      onBlur={() => ctx?.setOpen(false)}
      className="inline-flex"
    >
      {children}
    </span>
  );
}

export function TooltipContent({ children, side = 'top' as 'top'|'bottom' }) {
  const ctx = useContext(TooltipCtx);
  if (!ctx?.open) return null;
  const pos = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  return (
    <div className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${pos}`}>
      <div className="whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-xs text-white shadow-lg">
        {children}
      </div>
    </div>
  );
}

