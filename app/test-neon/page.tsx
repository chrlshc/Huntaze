'use client';

import NeonCircuit from '@/app/components/NeonCircuit';
import SimpleNeonTest from '@/app/components/SimpleNeonTest';

export default function TestNeonPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0614]">
      {/* Test du composant SimpleNeonTest d\'abord */}
      <SimpleNeonTest />
      
      {/* Contenu simple pour vérifier que l\'effet est visible */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8">
            Test Animation Canvas
          </h1>
          <p className="text-xl text-white/70">
            Tu devrais voir une ligne violette ondulante animée
          </p>
        </div>
      </div>
    </div>
  );
}