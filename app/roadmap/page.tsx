import type { Metadata } from 'next';
import Link from 'next/link';
import RoadmapClient from './roadmap-client';

export const metadata: Metadata = {
  title: 'Roadmap & Feature Voting - Huntaze',
  description: 'Weekly feature voting and delivery cadence by plan (PRO, SCALE, ENTERPRISE).',
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Roadmap & Feature Voting
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          We ship improvements every week. Customers vote to prioritize what we build.
        </p>

        <div className="space-y-8">
          <RoadmapClient />
          <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Cadence by plan</h2>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li><strong>Starter/Free trial</strong>: 1 feature/week (community vote)</li>
              <li><strong>PRO</strong>: 2 features/week (priority vote)</li>
              <li><strong>SCALE</strong>: 2 features/week (increased vote weight)</li>
              <li><strong>ENTERPRISE</strong>: 3 features/week + fast‑track for critical requests</li>
            </ul>
          </section>

          <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">How voting works</h2>
            <ol className="list-decimal pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Monday: publish the shortlist (qualified, estimated issues)</li>
              <li>Tue–Thu: in‑app voting (1‑click, optional comment)</li>
              <li>Friday: announce winners + dev kickoff</li>
              <li>Following week: shipped with release notes</li>
            </ol>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Note: In case of urgent security/reliability work, some capacity may be reserved for fixes.
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Fairness & transparency</h2>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Public backlog (categories: AI, Analytics, Platforms, Billing, Onboarding)</li>
              <li>Weighted voting by plan (Enterprise &gt; Scale &gt; Pro &gt; Starter)</li>
              <li>Delivery history and expected impact</li>
              <li>Evolving roadmap; feedback welcome</li>
            </ul>
          </section>

          <div className="text-center">
            <Link href="/pricing" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
              See plans and benefits →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
