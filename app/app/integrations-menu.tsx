'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, BarChart3, TestTube2, Cloud, Database, Upload, MessageSquare, ArrowRight } from 'lucide-react';

export function IntegrationsMenu() {
  const integrations = [
    {
      title: 'AI Chat Assistant',
      description: 'Chat with Azure OpenAI GPT-4o powered assistant',
      icon: Bot,
      href: '/app/ai-chat',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      features: ['Real-time responses', 'Cost tracking', 'Conversation history'],
    },
    {
      title: 'Real-Time Analytics',
      description: 'Live metrics powered by AWS DynamoDB',
      icon: BarChart3,
      href: '/app/analytics/realtime',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      features: ['Revenue tracking', 'Fan engagement', 'Content performance'],
    },
    {
      title: 'Integration Tests',
      description: 'Verify all cloud services are operational',
      icon: TestTube2,
      href: '/app/tests/integration',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      features: ['Service health', 'Configuration check', 'Troubleshooting'],
    },
  ];

  const apis = [
    {
      title: 'AI Chat API',
      endpoint: '/api/ai/chat',
      method: 'POST',
      icon: MessageSquare,
    },
    {
      title: 'Media Upload API',
      endpoint: '/api/media/upload',
      method: 'POST',
      icon: Upload,
    },
    {
      title: 'Analytics API',
      endpoint: '/api/analytics/track',
      method: 'POST/GET',
      icon: Database,
    },
    {
      title: 'Service Health',
      endpoint: '/api/test-services',
      method: 'GET',
      icon: Cloud,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main Features */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Cloud Integrations</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${integration.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${integration.color}`} />
                  </div>
                  <CardTitle className="text-xl">{integration.title}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {integration.features.map((feature) => (
                      <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={integration.href}>
                    <Button className="w-full group">
                      Open
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* API Endpoints */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available APIs</h2>
        <Card>
          <CardHeader>
            <CardTitle>REST API Endpoints</CardTitle>
            <CardDescription>
              Use these endpoints to integrate with your cloud services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apis.map((api) => {
                const Icon = api.icon;
                return (
                  <div key={api.endpoint} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{api.title}</p>
                        <code className="text-xs text-muted-foreground">{api.endpoint}</code>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                      {api.method}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">Azure</p>
              <p className="text-sm text-muted-foreground">OpenAI GPT-4o</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">AWS</p>
              <p className="text-sm text-muted-foreground">DynamoDB</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">AWS</p>
              <p className="text-sm text-muted-foreground">S3 Storage</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">AWS</p>
              <p className="text-sm text-muted-foreground">SQS Queues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}