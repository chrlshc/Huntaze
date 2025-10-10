const logos = ["CreatorHub", "NovaStudios", "Orbit Talent", "Lumen Collective"];

export function ClientsSection() {
  return (
    <section className="mx-auto max-w-5xl space-y-8 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Trusted by top creators</h2>
        <p className="mt-2 text-base text-gray-400">Over 120 teams rely on Huntaze to operate their OnlyFans business.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {logos.map((logo) => (
          <div
            key={logo}
            className="rounded-lg border border-gray-800 bg-gray-800/60 p-4 text-center text-sm font-semibold text-gray-200"
          >
            {logo}
          </div>
        ))}
      </div>
    </section>
  );
}
