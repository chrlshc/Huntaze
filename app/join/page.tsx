"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to /auth page
    router.replace('/auth');
  }, [router]);
  
  return null;
}