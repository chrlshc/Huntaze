/**
 * Marketing Layout
 * Forces dynamic rendering for all marketing pages to prevent build-time errors
 */

export const dynamic = 'force-dynamic';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
