import React from 'react';
import AppShell from '@/src/components/hznew/app-shell';

async function getBadges() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nav/badges`, { next: { revalidate: 30 } });
    if (!res.ok) return {} as Record<string, number>;
    return res.json() as Promise<Record<string, number>>;
  } catch {
    return {} as Record<string, number>;
  }
}

export default async function NestedAppLayout({ children }: { children: React.ReactNode }) {
  const navBadges = await getBadges();
  return (
    <AppShell navBadges={navBadges}>
      {children}
    </AppShell>
  );
}
