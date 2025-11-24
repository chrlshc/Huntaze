/**
 * Analytics Layout
 * Forces dynamic rendering for all analytics pages to prevent build-time errors
 */

export const dynamic = 'force-dynamic';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
