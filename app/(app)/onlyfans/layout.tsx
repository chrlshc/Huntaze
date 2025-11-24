/**
 * OnlyFans Layout
 * Forces dynamic rendering for all OnlyFans pages to prevent build-time errors
 */

export const dynamic = 'force-dynamic';

export default function OnlyFansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
