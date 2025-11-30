"use client";
import React from 'react';
import { Button } from "@/components/ui/button";

export function IOSA2HSOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Installer sur l’écran d’accueil</h3>
        <ol className="list-decimal ml-5 space-y-1 text-sm">
          <li>Tape <strong>Partager</strong> (icône en bas).</li>
          <li>Choisis <strong>Ajouter à l’écran d’accueil</strong>.</li>
          <li>Ouvre <strong>Huntaze</strong> depuis l’icône créée.</li>
        </ol>
        <p className="mt-3 text-xs text-gray-500">
          iOS ne propose pas de prompt d’installation — le passage par “Ajouter à l’écran d’accueil” est la méthode recommandée.
        </p>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            J’ai compris
          </Button>
        </div>
      </div>
    </div>
  );
}

