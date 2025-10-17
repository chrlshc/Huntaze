import { IntegrationsMenu } from '../integrations-menu';

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">AWS & Azure Integrations</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Your Huntaze platform is now powered by enterprise-grade cloud services. 
          Explore the real AI capabilities, analytics, and storage solutions integrated into your application.
        </p>
      </div>
      
      <IntegrationsMenu />
    </div>
  );
}