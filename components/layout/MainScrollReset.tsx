'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function MainScrollReset({ targetId = 'main-content' }: { targetId?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.getElementById(targetId);

    if (main) {
      const styles = window.getComputedStyle(main);
      const overflowY = styles.overflowY;
      const isScrollable =
        (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
        main.scrollHeight > main.clientHeight;

      if (isScrollable) {
        main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, targetId]);

  return null;
}
