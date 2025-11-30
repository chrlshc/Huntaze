import { Card } from '@/components/ui/card';
export function PricingPro() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 text-center">
        <Card className="inline-block rounded-lg border p-6">
          <div className="text-2xl font-semibold">Pro</div>
          <div className="text-sm text-muted-foreground">Custom pricing</div>
        </Card>
      </div>
    </section>
  );
}

export default PricingPro;

