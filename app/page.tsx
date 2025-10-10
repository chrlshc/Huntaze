import type { Metadata } from 'next';

import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Huntaze · Revenue OS for OnlyFans',
};

export default function RootLandingPage() {
  return <LandingPage />;
}
