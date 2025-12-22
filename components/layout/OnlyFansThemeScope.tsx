'use client';

import { useEffect } from 'react';

export function OnlyFansThemeScope() {
  useEffect(() => {
    const themeClass = 'onlyfans-theme';

    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);

    return () => {
      document.documentElement.classList.remove(themeClass);
      document.body.classList.remove(themeClass);
    };
  }, []);

  return null;
}

