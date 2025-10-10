import type { ReactNode } from "react";

// Keep Analytics page using its own HZ shell (app/analytics/page.tsx)
// Avoid double shells by returning children directly.
export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
