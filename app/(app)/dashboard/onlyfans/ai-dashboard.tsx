'use client';

import Link from 'next/link';

export default function AIDashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">OnlyFans AI Dashboard</h1>
      <p className="text-muted-foreground max-w-xl">
        This is a placeholder dashboard. Replace this component with the real analytics
        view when the integration is ready.
      </p>
      <Link href="/platforms/connect" className="text-sm text-primary underline">
        Configure your integrations →
      </Link>
    </div>
  );
}
