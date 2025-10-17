'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TestIntegrationPage() {
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
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integration Test</h1>
        <p className="text-muted-foreground">
          Test all AWS and Azure service integrations
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Click the button below to test all integrated services
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button 
            onClick={testServices} 
            disabled={loading}
            className="w-full mb-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Services...
              </>
            ) : (
              'Test All Services'
            )}
          </Button>

          {results && (
            <div className="space-y-4">
              {/* Service Status */}
              <div className="space-y-2">
                <h3 className="font-semibold mb-2">Services</h3>
                {Object.entries(results.services || {}).map(([service, data]: any) => (
                  <div key={service} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(data.status)}
                      <span className="font-medium capitalize">
                        {service.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {data.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Environment Variables */}
              {results.environment && (
                <div className="space-y-2">
                  <h3 className="font-semibold mb-2">Environment</h3>
                  <div className="space-y-1">
                    {Object.entries(results.environment).map(([key, value]: any) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs">{key}</span>
                        <span className={value === true || (typeof value === 'string' && value !== 'not set') ? 'text-green-600' : 'text-red-600'}>
                          {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {results.summary && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">
                    {results.summary.all_services_ok ? (
                      <span className="text-green-600">✓ All services are operational</span>
                    ) : (
                      <span className="text-yellow-600">⚠ Some services need attention</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}