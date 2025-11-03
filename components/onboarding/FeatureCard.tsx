'use client';

import { Lock, CheckCircle2, TrendingUp } from 'lucide-react';

interface UnlockRequirement {
  type: string;
  condition: string;
  met: boolean;
  description: string;
}

interface FeatureCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isUnlocked: boolean;
  requirements?: UnlockRequirement[];
  progress?: number;
  onClick?: () => void;
}

export default function FeatureCard({
  id,
  name,
  description,
  icon,
  category,
  isUnlocked,
  requirements = [],
  progress = 0,
  onClick
}: FeatureCardProps) {
  const metRequirements = requirements.filter(r => r.met).length;
  const totalRequirements = requirements.length;
  const progressPercentage = totalRequirements > 0 
    ? (metRequirements / totalRequirements) * 100 
    : 0;

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
        isUnlocked
          ? 'border-green-500 bg-green-50 hover:shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
          isUnlocked ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {name}
              </h3>
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                {category}
              </span>
            </div>
            {isUnlocked ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {description}
          </p>

          {/* Unlock Requirements */}
          {!isUnlocked && requirements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Unlock Progress</span>
                <span>{metRequirements}/{totalRequirements} requirements met</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Requirements List */}
              <div className="space-y-1 mt-3">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs"
                  >
                    {req.met ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                      {req.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Status */}
          {isUnlocked && (
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <TrendingUp className="w-4 h-4" />
              Ready to use
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
