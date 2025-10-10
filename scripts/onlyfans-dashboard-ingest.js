'use strict';

/**
 * Quick helper to push sample OnlyFans dashboard data into the Next.js ingest endpoint.
 *
 * Usage:
 *   HUNTAZE_DASHBOARD_INGEST_TOKEN=secret \
 *   DASHBOARD_INGEST_URL=https://app.huntaze.com/api/onlyfans/dashboard/ingest \
 *   node scripts/onlyfans-dashboard-ingest.js
 *
 * By default the script targets http://localhost:3000 for local testing. Set
 * DASHBOARD_ACCOUNT_ID to push data for a specific account (defaults to demo-account).
 */

const INGEST_URL =
  process.env.DASHBOARD_INGEST_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/api/onlyfans/dashboard/ingest`;
const ACCOUNT_ID = process.env.DASHBOARD_ACCOUNT_ID || 'demo-account';
const TOKEN = process.env.HUNTAZE_DASHBOARD_INGEST_TOKEN || '';

if (!TOKEN) {
  console.error(
    'Missing HUNTAZE_DASHBOARD_INGEST_TOKEN environment variable.\n' +
      'Set it to the secret configured in the Next.js app before running this script.',
  );
  process.exit(1);
}

/**
 * Example payload. Replace with real data from your scraper.
 */
const payload = {
  accountId: ACCOUNT_ID,
  summaryCards: [
    {
      id: 'monthly_revenue',
      title: 'Revenus ce mois',
      status: 'active',
      description: 'Chiffre d’affaires net sur les 30 derniers jours.',
      bullets: [
        'Top tipper: @luna-szn ($420)',
        'Croissance +18% vs mois dernier',
      ],
    },
    {
      id: 'new_fans',
      title: 'Nouveaux fans',
      status: 'active',
      description: 'Abonnés payants acquis sur les 7 derniers jours.',
      bullets: ['31 nouveaux abonnés', 'Taux de conversion 6,4%'],
    },
  ],
  actionList: {
    currency: 'USD',
    items: [
      {
        id: 'follow_up_ppv',
        fanId: 'fan_ppv_067',
        fanName: 'GoldenDusk',
        reason: 'PPV prévisualisé sans achat',
        priority: 'Today',
        expectedValue: 190,
        lastSpent: 65,
        daysSinceLastPurchase: 2,
        suggestion:
          'Envoyer une offre limitée avec bonus coulisses + remise 20%.',
        segment: 'PPV warm',
        confidence: 0.72,
      },
      {
        id: 'vip_idle',
        fanId: 'fan_vip_001',
        fanName: 'Luna SZN',
        reason: 'VIP inactif depuis 7 jours',
        priority: 'NOW',
        expectedValue: 1240,
        lastSpent: 860,
        daysSinceLastPurchase: 7,
        suggestion: 'Message vocal personnalisé + teasing drop exclusif.',
        segment: 'VIP',
        confidence: 0.88,
      },
    ],
  },
  signals: [
    {
      id: `sig_${Date.now()}`,
      type: 'Tip',
      headline: 'Nouveau tip de $75 par @neon-nova',
      payload: {
        fan: 'neon-nova',
        amount: 75,
      },
      createdAt: new Date().toISOString(),
      severity: 'success',
    },
  ],
  insights: {
    title: 'Focus revenue',
    description:
      'Les fans réengagés via séquence DM 48h génèrent +42% de revenus.',
    actionLabel: 'Optimiser les séquences',
    actionHref: '/dashboard/onlyfans/campaigns',
  },
  bestTimes: {
    bestHours: [20, 21, 22],
    bestDays: ['Fri', 'Sat', 'Sun'],
  },
};

async function run() {
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Ingest failed (${res.status}): ${text}`);
    process.exit(1);
  }

  const json = await res.json();
  console.log('Ingest OK:', JSON.stringify(json, null, 2));
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
