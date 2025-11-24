"use client";

// Enable static generation for optimal performance and SEO
export const dynamic = 'force-static';

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