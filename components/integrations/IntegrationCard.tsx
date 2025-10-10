import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

type IntegrationStatus = "connected" | "available" | "coming-soon";

const statusTokens: Record<
  IntegrationStatus,
  { label: string; dotClass: string; toneClass: string; icon: ReactNode }
> = {
  connected: {
    label: "Connected",
    dotClass: "bg-success",
    toneClass: "text-success",
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
  },
  available: {
    label: "Available",
    dotClass: "bg-primary",
    toneClass: "text-content-secondary",
    icon: <ArrowUpRight className="h-4 w-4" aria-hidden="true" />,
  },
  "coming-soon": {
    label: "Coming soon",
    dotClass: "bg-warning",
    toneClass: "text-warning",
    icon: <Clock className="h-4 w-4" aria-hidden="true" />,
  },
};

export interface IntegrationCardProps {
  name: string;
  description: string;
  logo?: string;
  category?: string;
  href?: string;
  status?: IntegrationStatus;
  badges?: Array<{ label: string; tone?: "success" | "warning" | "danger" | "info" }>;
  accentColor?: string;
  className?: string;
}

const toneClassName: Record<"success" | "warning" | "danger" | "info", string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-info/15 text-info border-info/30",
};

export function IntegrationCard({
  name,
  description,
  logo,
  category,
  href,
  status = "available",
  badges = [],
  accentColor,
  className,
}: IntegrationCardProps) {
  const statusMeta = statusTokens[status];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-sm transition hover:border-border-strong hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border-subtle bg-surface-muted transition group-hover:shadow-sm",
            accentColor ? "shadow-none" : null,
          )}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        >
          {logo ? (
            <Image
              src={logo}
              alt={name}
              fill
              className="object-contain p-2"
              sizes="56px"
            />
          ) : (
            <span className="text-lg font-semibold text-content-secondary">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-content-primary">{name}</h3>
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-medium",
                  toneClassName[badge.tone ?? "info"],
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
          {category ? (
            <p className="text-xs font-medium uppercase tracking-wide text-content-subtle">
              {category}
            </p>
          ) : null}
        </div>

        <span className={cn("flex items-center gap-1 text-xs font-medium", statusMeta.toneClass)}>
          <span className={cn("h-2 w-2 rounded-full", statusMeta.dotClass)} />
          {statusMeta.label}
        </span>
      </div>

      <p className="mt-4 text-sm text-content-secondary">{description}</p>

      {href ? (
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary-hover"
          prefetch={false}
        >
          Explore integration
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-content-subtle">
          {statusMeta.icon}
          {statusMeta.label}
        </span>
      )}
    </article>
  );
}
