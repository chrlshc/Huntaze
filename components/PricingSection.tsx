import Link from "next/link";
import { Card } from '@/components/ui/card';

export function PricingSection() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Pricing</h2>
        <p className="mt-2 text-base text-gray-400">Bêta ouverte : toutes les fonctionnalités, aucun coût.</p>
      </div>
      <Card className="rounded-2xl border border-[var(--border-default)] bg-white/5 p-8 text-center shadow-[0_35px_120px_-45px_rgba(0, 0, 0, 0.7)]">
        <p className="text-4xl font-extrabold text-white">0€</p>
        <p className="mt-3 text-gray-300">Accès complet pendant la phase bêta. Passez en production quand vous êtes prêt.</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Rejoindre la bêta
        </Link>
      </Card>
    </section>
  );
}
