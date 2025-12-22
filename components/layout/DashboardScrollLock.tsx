'use client';

import { useEffect } from 'react';

const DASHBOARD_SHELL_CLASS = 'huntaze-dashboard-shell';

export function DashboardScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.add(DASHBOARD_SHELL_CLASS);
    body.classList.add(DASHBOARD_SHELL_CLASS);

    return () => {
      html.classList.remove(DASHBOARD_SHELL_CLASS);
      body.classList.remove(DASHBOARD_SHELL_CLASS);
    };
  }, []);

  return null;
}

