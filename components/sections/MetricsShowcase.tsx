export function MetricsShowcase() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-2xl font-semibold">+35%</div>
          <div className="text-xs text-muted-foreground">Conversion lift</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">4.9/5</div>
          <div className="text-xs text-muted-foreground">Creator rating</div>
        </div>
        <div>
          <div className="text-2xl font-semibold"><span className="tabular-nums">24/7</span></div>
          <div className="text-xs text-muted-foreground">AI assistance</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">Secured</div>
          <div className="text-xs text-muted-foreground">Privacy-first</div>
        </div>
      </div>
    </section>
  );
}

export default MetricsShowcase;

