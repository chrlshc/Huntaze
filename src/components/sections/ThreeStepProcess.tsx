export function ThreeStepProcess() {
  const steps = [
    { title: 'Connect', desc: 'Securely connect your platforms.' },
    { title: 'Automate', desc: 'Set smart workflows and guardrails.' },
    { title: 'Grow', desc: 'Track performance and iterate fast.' },
  ];
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.title} className="rounded-lg border p-6">
            <h3 className="font-medium">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ThreeStepProcess;

