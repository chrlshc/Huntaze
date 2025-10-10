'use client';

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { IntegrationCard, type IntegrationCardProps } from "./IntegrationCard";
import { cn } from "@/lib/utils";

type IntegrationCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

const integrationCatalogue: Array<IntegrationCardProps & { id: string; categoryId: string }> = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Automate DMs, schedule story drops, and sync engagement insights directly into Huntaze.",
    logo: "/logos/instagram.svg",
    categoryId: "social",
    status: "connected",
    badges: [{ label: "Auto-DM", tone: "info" }],
    accentColor: "#FFF1F4",
    href: "/platforms/connect",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Convert viral spikes into paying fans with automated funnels and real-time dashboards.",
    logo: "/logos/tiktok.svg",
    categoryId: "social",
    status: "available",
    badges: [{ label: "Beta", tone: "warning" }],
    accentColor: "#F0FDFA",
    href: "/auth/tiktok",
  },
  {
    id: "onlyfans",
    name: "OnlyFans",
    description: "Two-way sync, content scheduling, and revenue analytics tailored to creator businesses.",
    logo: "/logos/onlyfans.svg",
    categoryId: "monetization",
    status: "connected",
    badges: [{ label: "Core", tone: "success" }],
    accentColor: "#EBF8FF",
    href: "/of-connect",
  },
  {
    id: "fansly",
    name: "Fansly",
    description: "Mirror high-value automations across fansly to keep VIPs nurtured everywhere.",
    logo: "/logos/fansly.svg",
    categoryId: "monetization",
    status: "available",
    accentColor: "#F5F3FF",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Route VIP alerts, workflows, and revenue pings to the channels your team already lives in.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=slack&backgroundType=gradientLinear",
    categoryId: "ops",
    status: "available",
    accentColor: "#FDF2F8",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Sync member roles and send renewal nudges without needing to hop across servers.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=discord&backgroundType=gradientLinear",
    categoryId: "community",
    status: "coming-soon",
    accentColor: "#EEF2FF",
    badges: [{ label: "Coming Soon", tone: "info" }],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Push payouts, refunds, and lifetime value segments straight into your command center.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=stripe&backgroundType=gradientLinear",
    categoryId: "finance",
    status: "available",
    accentColor: "#E0F2FE",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync your creator playbooks and campaign templates—no copy-pasting across docs.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=notion&backgroundColor=b6e6bd",
    categoryId: "ops",
    status: "available",
    accentColor: "#F8FAFC",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Overlay traffic surges with revenue spikes to see which funnel actually converts.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=ga&backgroundColor=fef9c3",
    categoryId: "analytics",
    status: "available",
    accentColor: "#FFFBEB",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Trigger paywalled drops to your warm lists the moment content goes live.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=mailchimp&backgroundColor=fde68a",
    categoryId: "marketing",
    status: "coming-soon",
    accentColor: "#FEF3C7",
    badges: [{ label: "Waitlist", tone: "warning" }],
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Capture high-Intent leads and sync them into Huntaze nurtures automatically.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=convertkit&backgroundColor=f4e8ff",
    categoryId: "marketing",
    status: "available",
    accentColor: "#F3E8FF",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Centralise content approvals and automation receipts in shared folders.",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=gdrive&backgroundColor=bae6fd",
    categoryId: "ops",
    status: "available",
    accentColor: "#E0F2FE",
  },
];

const categories: IntegrationCategory[] = [
  { id: "all", name: "All integrations", icon: "🔗", description: "Every channel connected to Huntaze." },
  { id: "social", name: "Social", icon: "📱", description: "Acquisition engines and viral loops." },
  { id: "monetization", name: "Monetisation", icon: "💸", description: "Platforms that pay the bills." },
  { id: "marketing", name: "Marketing", icon: "📣", description: "Build audiences and nurture fans." },
  { id: "analytics", name: "Analytics", icon: "📊", description: "Understand what is working." },
  { id: "community", name: "Community", icon: "💬", description: "Keep superfans engaged." },
  { id: "ops", name: "Operations", icon: "⚙️", description: "Orchestrate the back office." },
  { id: "finance", name: "Finance", icon: "💳", description: "Track payments and growth." },
];

export function IntegrationsSectionSimple() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredIntegrations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return integrationCatalogue.filter((integration) => {
      const matchesCategory =
        selectedCategory === "all" || integration.categoryId === selectedCategory;
      const matchesSearch =
        !search ||
        integration.name.toLowerCase().includes(search) ||
        integration.description.toLowerCase().includes(search) ||
        (integration.categoryId && integration.categoryId.includes(search));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <section className="bg-background-primary py-24">
      <div className="container-default">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-muted px-4 py-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Unified integrations
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-content-primary sm:text-4xl">
            Your creator stack, already connected
          </h2>
          <p className="mt-4 text-base text-content-secondary">
            Pick the channels that move revenue, then automate the busy-work. Huntaze keeps data
            flowing between social, monetisation, and ops with a consistent interface.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="input-quiet pl-11"
              placeholder="Search integrations or categories"
              aria-label="Search integrations"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            const count =
              category.id === "all"
                ? integrationCatalogue.length
                : integrationCatalogue.filter((integration) => integration.categoryId === category.id)
                    .length;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-ring",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-subtle bg-transparent text-content-secondary hover:border-border-strong hover:bg-surface-muted",
                )}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    isActive ? "bg-primary text-primary-foreground" : "bg-surface-muted text-content-subtle",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredIntegrations.map(({ id, ...integration }) => (
            <IntegrationCard key={id} {...integration} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-content-secondary">
            Need something custom? We ship new integrations alongside your roadmap.
          </p>
          <Link
            href="/support"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
          >
            Request an integration
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
