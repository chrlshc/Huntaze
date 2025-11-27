// Force dynamic rendering for smart onboarding analytics
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SmartOnboardingAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
