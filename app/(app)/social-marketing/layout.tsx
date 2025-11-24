export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function DynamicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

