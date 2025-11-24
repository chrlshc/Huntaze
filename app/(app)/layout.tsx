/**
 * App Layout
 * Forces dynamic rendering for all authenticated app pages
 * This prevents build-time errors when database/Redis connections are not available
 */

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
