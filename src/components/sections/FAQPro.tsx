export function FAQPro() {
  const items = [
    { q: 'Is Huntaze safe?', a: 'Yes, we follow best practices and encryption.' },
    { q: 'Which platforms are supported?', a: 'OnlyFans, Instagram, TikTok, Reddit, and more soon.' },
  ];
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold mb-4">Frequently asked questions</h3>
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.q} className="rounded-lg border p-4">
              <div className="font-medium">{it.q}</div>
              <div className="text-sm text-muted-foreground mt-1">{it.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQPro;

