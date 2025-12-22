'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ContentListPage() {
  const router = useRouter();

  // Redirect to main marketing page which has the content queue
  useEffect(() => {
    router.replace('/marketing');
  }, [router]);

  return null;
}
