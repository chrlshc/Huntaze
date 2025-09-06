'use client';

import { useState } from 'react';
import { Volume2, Play, DollarSign, Heart, Star, Copy, TrendingUp } from 'lucide-react';
import { PPV_SOUND_EFFECTS, soundEffects } from '@/lib/of/ppv-sound-effects';
import { MODEL_NICHES, CONVERSION_SCRIPTS, personalizeScript } from '@/lib/of/model-scripts-niches';

export default function SoundScriptSettings() {
  const [selectedSound, setSelectedSound] = useState('cash-register');
  const [volume, setVolume] = useState(70);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState('girl_next_door');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const handleTestSound = () => {
    soundEffects.setSound(selectedSound);
    soundEffects.setVolume(volume / 100);
    soundEffects.testSound();
  };

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(script);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const nicheScripts = CONVERSION_SCRIPTS.filter(
    s => s.niche === selectedNiche || s.niche === 'all'
  );

  return (
    <div className="space-y-8">
      {/* PPV Sale Sounds */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">PPV Sale Sounds</h2>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              soundEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              soundEnabled ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Hear that sweet sound every time you make a sale! Like Shopify's cha-ching 💰
        </p>

        {/* Sound Selection */}
        <div className="grid gap-3 mb-6">
          {PPV_SOUND_EFFECTS.filter(s => s.category === 'sale').map(sound => (
            <button
              key={sound.id}
              onClick={() => setSelectedSound(sound.id)}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                selectedSound === sound.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {sound.minAmount ? (
                  <DollarSign className="w-5 h-5 text-green-600" />
                ) : (
                  <Heart className="w-5 h-5 text-pink-600" />
                )}
                <div className="text-left">
                  <h3 className="font-medium">{sound.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {sound.description}
                  </p>
                  {sound.minAmount && (
                    <p className="text-xs text-purple-600 mt-1">
                      Only for sales ${sound.minAmount}+
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.setSound(sound.id);
                  soundEffects.testSound();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Play className="w-4 h-4" />
              </button>
            </button>
          ))}
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Volume</span>
            <span>{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <button
          onClick={handleTestSound}
          className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          Test Sound
        </button>
      </div>

      {/* Model Niches & Scripts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Proven Scripts by Niche</h2>
        </div>

        {/* Niche Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Your Niche</label>
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            {Object.values(MODEL_NICHES).map(niche => (
              <option key={niche.id} value={niche.id}>
                {niche.name} - {niche.description}
              </option>
            ))}
          </select>
          
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Average PPV Price:</span> ${MODEL_NICHES[selectedNiche].averagePrice.min}-${MODEL_NICHES[selectedNiche].averagePrice.max}
            </p>
            <p className="text-sm mt-1">
              <span className="font-medium">Top Content:</span> {MODEL_NICHES[selectedNiche].topContent.join(', ')}
            </p>
          </div>
        </div>

        {/* Scripts */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">
            High-Converting Scripts
          </h3>
          
          {nicheScripts.map(script => (
            <div key={script.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{script.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="capitalize">{script.type.replace('_', ' ')}</span>
                    {script.conversionRate && (
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        {(script.conversionRate * 100).toFixed(0)}% conversion
                      </span>
                    )}
                    {script.bestTime && (
                      <span>Best: {script.bestTime}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => copyScript(script.script)}
                  className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    copiedScript === script.script ? 'text-green-600' : ''
                  }`}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm italic">
                "{script.script}"
              </div>
              
              {script.variants.length > 0 && (
                <details className="mt-3">
                  <summary className="text-sm text-purple-600 cursor-pointer">
                    View {script.variants.length} variations
                  </summary>
                  <div className="mt-2 space-y-2">
                    {script.variants.map((variant, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 mt-1">{idx + 1}.</span>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm italic">
                          "{variant}"
                        </div>
                        <button
                          onClick={() => copyScript(variant)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 <strong>Pro Tip:</strong> Test different scripts and track which ones convert best for YOUR audience. What works for one model might not work for another!
          </p>
        </div>
      </div>
    </div>
  );
}