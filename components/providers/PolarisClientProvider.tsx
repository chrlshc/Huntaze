'use client';

import { AppProvider } from '@shopify/polaris';

export default function PolarisClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProvider i18n={{}}>{children}</AppProvider>;
}
