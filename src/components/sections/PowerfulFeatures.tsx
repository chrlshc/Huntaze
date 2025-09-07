export function PowerfulFeatures() {
  const features = [
    'Unified inbox with AI assist',
    'Campaign automation',
    'Advanced analytics',
    'Integrations & webhooks',
  ];
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f} className="rounded-lg border p-6">
            <h4 className="font-medium">{f}</h4>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PowerfulFeatures;

