'use client';

import Link from 'next/link';

export default function Client() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Connect OnlyFans</h1>
      <p className="mt-2 text-sm text-gray-600">
        Recommended: open OnlyFans in your browser. Our extension will securely sync your session to Huntaze.
      </p>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Browser bridge (recommended)</h2>
        <ol className="mt-2 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>Install the OF Cookie Bridge extension (Developer mode).</li>
          <li>Click “Open OnlyFans” and sign in.</li>
          <li>Return here — your cookies will sync automatically.</li>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="https://onlyfans.com/login"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open OnlyFans
          </a>
          <a
            href="/extensions/of-cookie-bridge"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm font-medium text-gray-700 underline underline-offset-2"
          >
            Install extension
          </a>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Note: the extension badge should show “ON” when paired with this page.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Manual fallback</h2>
        <p className="mt-1 text-sm text-gray-600">
          If you cannot install the extension, you can upload a Playwright cookie array for <code>onlyfans.com</code>.
        </p>
        <div className="mt-3">
          <Link
            href="/of-connect/cookies"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Go to cookie upload →
          </Link>
        </div>
      </section>
    </div>
  );
}
