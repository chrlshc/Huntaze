export function PlatformIntegrations() {
  const platforms = ['OnlyFans', 'Instagram', 'TikTok', 'Reddit'];
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold mb-4">Integrations</h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {platforms.map((p) => (
            <span key={p} className="rounded border px-3 py-1">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlatformIntegrations;

