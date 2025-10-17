'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AIDashboard from './ai-dashboard';

export default function OnlyFansDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has connected OnlyFans
    const ofSession = localStorage.getItem('of_session');
    if (!ofSession) {
      // Redirect to login page
      router.push('/platforms/connect/onlyfans/login');
    }
  }, [router]);

  return <AIDashboard />;
}