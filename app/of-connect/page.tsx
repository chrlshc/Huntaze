'use client';

import { useState } from 'react';
import Link from 'next/link';

type LoginPayload = {
  email: string;
  password: string;
  otp?: string;
};

export default function OfConnectPage() {
  const [form, setForm] = useState<LoginPayload>({ email: '', password: '', otp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/of/login/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, otp: form.otp || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Login failed');
      setStatus('✅ Login lancé. Si un OTP est requis, ajoutez-le et relancez.');
    } catch (err: any) {
      setStatus('❌ ' + (err?.message || 'Erreur inconnue'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Connect OnlyFans</h1>
      <p className="mt-2 text-sm text-gray-600">
        Deux options: connexion managée (recommandé) ou dépôt de cookies si vous avez déjà une session valide.
      </p>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Connexion managée (ECS)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Entrez vos identifiants. Nous lancerons un navigateur sécurisé côté serveur. Si OnlyFans demande un OTP,
          renseignez-le et relancez pour finaliser la connexion.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Code OTP (si demandé)</label>
            <input
              type="text"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              placeholder="123456"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {submitting ? 'Connexion…' : 'Lancer la connexion'}
            </button>
          </div>
          {status && <p className="text-sm text-gray-600">{status}</p>}
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Déjà connecté ? Déposer des cookies</h2>
        <p className="mt-1 text-sm text-gray-600">
          Si vous avez un export Playwright de cookies <code>onlyfans.com</code>, déposez-les directement.
        </p>
        <div className="mt-3">
          <Link
            href="/of-connect/cookies"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Aller à la page de dépôt →
          </Link>
        </div>
      </section>
    </div>
  );
}

