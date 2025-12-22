'use client';

import { Page, Card, Text } from '@shopify/polaris';

export default function DashboardPage() {
  return (
    <Page title="Dashboard">
      <Card>
        <Text as="p">Welcome to your dashboard!</Text>
      </Card>
    </Page>
  );
}
