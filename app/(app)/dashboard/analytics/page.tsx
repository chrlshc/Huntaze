import { Metadata } from 'next';
import { RealTimeAnalytics } from '@/components/dashboard/RealTimeAnalytics';

export const metadata: Metadata = {
  title: 'Analytics - Huntaze Dashboard',
  description: 'Real-time analytics and insights for your content performance',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your performance, revenue, and content engagement in real-time
        </p>
      </div>

      <RealTimeAnalytics />
    </div>
  );
}