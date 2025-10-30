'use client';

import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak';
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++; // lowercase
  if (/[A-Z]/.test(password)) score++; // uppercase
  if (/[0-9]/.test(password)) score++; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score++; // special chars
  
  // Determine strength
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;
  
  const strength = calculatePasswordStrength(password);
  
  const strengthConfig = {
    weak: {
      label: 'Weak',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      width: 'w-1/3',
    },
    medium: {
      label: 'Medium',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      width: 'w-2/3',
    },
    strong: {
      label: 'Strong',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      width: 'w-full',
    },
  };
  
  const config = strengthConfig[strength];
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.color} transition-all duration-300 ${config.width}`}
        />
      </div>
    </div>
  );
}
