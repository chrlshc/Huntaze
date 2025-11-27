export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
