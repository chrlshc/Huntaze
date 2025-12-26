'use client';

import { useState } from 'react';
import { generateBookmarkletCode } from '@/lib/of-connect/bookmarklet';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';

interface Props {
  userId: string;
}

export function BookmarkletSetup({ userId }: Props) {
  const [copied, setCopied] = useState(false);

  // Génération de l'URL API complète
  const apiUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/of/link-account`;
  
  // Génération du code JS
  const bookmarkletCode = generateBookmarkletCode(userId, apiUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 text-white rounded-xl overflow-hidden shadow-2xl border border-gray-800">
      
      {/* Header */}
      <div className="p-6 bg-gray-800/50 border-b border-gray-700 text-center">
        <div className="w-12 h-12 bg-[#00AFF0] rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-white">OF</span>
        </div>
        <h2 className="text-xl font-bold">Connexion Mobile (Safari)</h2>
        <p className="text-sm text-gray-400 mt-1">Configuration unique • Valable ~6 mois</p>
      </div>

      {/* Action Principale */}
      <div className="p-6">
        <button
          onClick={handleCopy}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
            copied 
              ? 'bg-green-500 hover:bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
              : 'bg-[#00AFF0] hover:bg-[#008ccf] shadow-[0_0_20px_rgba(0,175,240,0.3)]'
          }`}
        >
          {copied ? <Check size={24} /> : <Copy size={24} />}
          {copied ? 'CODE COPIÉ !' : 'COPIER LE CODE MAGIQUE'}
        </button>

        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 text-xs text-yellow-200">
          <Info className="shrink-0 w-4 h-4 mt-0.5" />
          <p>Ce code permet de récupérer ta session OnlyFans de manière sécurisée sans partager ton mot de passe.</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 pb-8 space-y-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instructions (iOS)</h3>

        <Step 
          num="1" 
          title="Ajoute en favori" 
          desc="Clique sur Partager (en bas de Safari) puis 'Ajouter aux favoris'." 
        />
        
        <Step 
          num="2" 
          title="Modifie le lien" 
          desc="Va dans tes favoris, clique sur 'Modifier', et sélectionne ce nouveau favori." 
        />
        
        <Step 
          num="3" 
          title="Colle le code" 
          desc="Important : Efface l'adresse URL existante et colle le code que tu as copié." 
        />
        
        <Step 
          num="4" 
          title="Connecte-toi" 
          desc="Va sur OnlyFans, connecte-toi, puis clique sur ton favori !" 
        />

        <a 
          href="https://onlyfans.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full text-center py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Ouvrir OnlyFans <ExternalLink className="inline w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
}

// Petit composant helper pour les étapes
function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-[#00AFF0]">
        {num}
      </div>
      <div>
        <h4 className="font-bold text-sm text-white">{title}</h4>
        <p className="text-sm text-gray-400 leading-snug mt-1">{desc}</p>
      </div>
    </div>
  );
}

export default BookmarkletSetup;
