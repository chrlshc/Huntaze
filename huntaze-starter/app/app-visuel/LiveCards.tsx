"use client";

import { useEffect, useState } from "react";

type Badges = Record<string, number>;

export default function LiveCards() {
  const [badges, setBadges] = useState<Badges | null>(null);
  const [ofConn, setOfConn] = useState<{ connected?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const origin = base || window.location.origin;

    (async () => {
      try {
        setError(null);
        const [badgeRes, statusRes] = await Promise.all([
          fetch(`${origin}/api/nav/badges`, { credentials: "include" }),
          fetch(`${origin}/api/integrations/onlyfans/status`, { credentials: "include" }),
        ]);
        setBadges(badgeRes.ok ? await badgeRes.json() : {});
        setOfConn(statusRes.ok ? await statusRes.json() : {});
      } catch (e: any) {
        setError(e?.message || "Failed to load live metrics");
      }
    })();
  }, []);

  const metrics = [
    { label: "Unread", value: badges?.["messages.unread"] ?? 0 },
    { label: "New Fans (24h)", value: badges?.["fans.new"] ?? 0 },
    { label: "Active Campaigns", value: badges?.["campaigns.active"] ?? 0 },
    { label: "Analytics Alerts", value: badges?.["analytics.alerts"] ?? 0 },
  ];

  return (
    <section className="mt-4" aria-labelledby="live-kpis">
      <h2 id="live-kpis" className="sr-only">
        Live Huntaze metrics
      </h2>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="kpi">
            <div className="kpi-h">{metric.label}</div>
            <div className="kpi-v">{metric.value}</div>
          </div>
        ))}

        <div className="kpi flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">OnlyFans</span>
          <span
            className={`chip ${ofConn?.connected ? "chip-ok" : "chip-no"}`}
            role="status"
            aria-live="polite"
          >
            {ofConn?.connected ? "Connected" : "Not connected"}
          </span>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-sm t-muted" role="alert">
          {error} — ensure NEXT_PUBLIC_APP_URL points to your app domain and that you are authenticated.
        </p>
      ) : null}
    </section>
  );
}
