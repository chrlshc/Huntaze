"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to register page
    router.replace('/auth/register');
  }, [router]);
  
  return null;
}