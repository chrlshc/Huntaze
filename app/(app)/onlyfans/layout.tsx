import '@/styles/shopify-tokens.css';
import '@/styles/onlyfans-polish-tokens.css';
import type { ReactNode } from 'react';
import { OnlyFansThemeScope } from '@/components/layout/OnlyFansThemeScope';

export default function OnlyFansLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="onlyfans-theme">
      <OnlyFansThemeScope />
      {children}
    </div>
  );
}
