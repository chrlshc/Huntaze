import { Metadata } from 'next';
import { RealTimeAnalytics } from '@/components/dashboard/RealTimeAnalytics';

export const metadata: Metadata = {
  title: 'Real-Time Analytics - Huntaze',
  description: 'Real-time analytics powered by AWS DynamoDB',
};

export default function RealTimeAnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Real-Time Analytics</h1>
        <p className="text-muted-foreground">
          Live performance metrics powered by AWS DynamoDB and Azure AI
        </p>
      </div>

      <RealTimeAnalytics />
    </div>
  );
}