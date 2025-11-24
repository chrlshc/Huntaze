/**
 * Home Layout
 * Forces dynamic rendering to prevent build-time errors with revalidate: 0
 */

export const dynamic = 'force-dynamic';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
