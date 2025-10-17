'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function IntegrationTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-services');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error testing services:', error);
      setResults({ error: 'Failed to test services' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'tables_not_created':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AWS/Azure Integration Test</h1>
        <p className="text-muted-foreground">
          Verify all cloud services are properly configured and operational
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Test Button */}
        <Card>
          <CardHeader>
            <CardTitle>Service Health Check</CardTitle>
            <CardDescription>
              Test connectivity to Azure OpenAI, AWS DynamoDB, S3, and SQS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testServices} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Health Checks...
                </>
              ) : (
                'Run Integration Tests'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <>
            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(results.services || {}).map(([service, data]: any) => (
                    <div key={service} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(data.status)}
                        <div>
                          <p className="font-medium capitalize">
                            {service.replace(/_/g, ' ')}
                          </p>
                          {data.details && (
                            <p className="text-sm text-muted-foreground">
                              {data.details.provider || data.details.region || data.status}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        data.status === 'ok' ? 'text-green-600' : 
                        data.status === 'tables_not_created' ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {data.status === 'tables_not_created' ? 'Setup Required' : data.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Environment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(results.environment || {}).map(([key, value]: any) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded">
                      <code className="text-xs">{key}</code>
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      ) : (
                        <span className={`text-sm ${
                          value !== 'not set' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary & Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {results.summary?.all_services_ok ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-medium text-green-600">
                      All services are operational!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your AWS and Azure integrations are working correctly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                      <p className="text-lg font-medium text-yellow-600">
                        Some services need configuration
                      </p>
                    </div>
                    
                    {results.services?.dynamodb?.status === 'tables_not_created' && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">DynamoDB Tables Not Created</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Run this command to create the required tables:
                        </p>
                        <code className="block p-2 bg-black/5 dark:bg-white/5 rounded text-sm">
                          npx tsx scripts/create-dynamodb-tables.ts
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}