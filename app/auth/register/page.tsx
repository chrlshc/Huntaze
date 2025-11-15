'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to unified auth page
    router.replace('/auth');
  }, [router]);
  
  return null;
}
