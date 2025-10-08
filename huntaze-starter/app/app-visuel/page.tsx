import Link from "next/link";

import AppShell from "@/components/AppShell";

import LiveCards from "./LiveCards";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  {
    href: "/messages",
    label: "Messages",
    title: "Inbox & AI",
    description: "Réponses IA dans votre voix, envoi PPV, 24/7.",
  },
  {
    href: "/fans",
    label: "Fans",
    title: "Segmentation CRM",
    description: "10 segments auto, LTV, churn risk, best hours.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    title: "Performance",
    description: "Conversion PPV, revenus, heures de pointe.",
  },
  {
    href: "/onlyfans",
    label: "OnlyFans",
    title: "Compte & Sessions",
    description: "Connexion, 2FA, session sécurisée.",
  },
  {
    href: "/integrations",
    label: "Integrations",
    title: "Proxy & autres",
    description: "Bright Data, rotation IP, status.",
  },
  {
    href: "/settings",
    label: "Settings",
    title: "AI & Sons PPV",
    description: "Sons, templates, niches, offline mode.",
  },
];

export default function AppDashboard() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Vue d’ensemble temps réel"
      actions={
        <>
          <Link className="btn btn-secondary" href="/messages">
            Open Inbox
          </Link>
          <Link className="btn btn-primary" href="/integrations">
            Connect OnlyFans
          </Link>
        </>
      }
    >
      <section className="section-stack">
        <LiveCards />
      </section>

      <section>
        <h2 className="sr-only">Quick navigation</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="card focus-ring">
              <div className="text-sm t-subtle mb-1">{item.label}</div>
              <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
              <p className="mt-1 t-subtle">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
