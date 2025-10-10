"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

type Status = "connected" | "attention" | "error" | "none";

type Action = {
  label: string;
  href: string;
  primary?: boolean;
};

export type ConnectorCardProps = {
  title: string;
  description?: string;
  status?: Status; // optional initial/default status
  statusText?: string; // optional override
  requiresAuth?: boolean; // if true, we check /api/auth/status first
  statusUrl?: string; // optional endpoint to resolve connection
  actions?: Action[];
  className?: string;
  children?: React.ReactNode;
};

function badgeClass(status: Status | undefined) {
  switch (status) {
    case "connected":
      return "hz-badge hz-badge--success";
    case "attention":
      return "hz-badge hz-badge--attention";
    case "error":
      return "hz-badge hz-badge--critical";
    default:
      return undefined;
  }
}

function defaultStatusText(status: Status | undefined) {
  switch (status) {
    case "connected":
      return "Connected";
    case "attention":
      return "Not connected";
    case "error":
      return "Error";
    default:
      return undefined;
  }
}

export default function ConnectorCard({
  title,
  description,
  status = "none",
  statusText,
  requiresAuth,
  statusUrl,
  actions = [],
  className,
  children,
}: ConnectorCardProps) {
  const [resolved, setResolved] = useState<Status>(status);
  const [resolvedText, setResolvedText] = useState<string | undefined>(statusText ?? defaultStatusText(status));

  useEffect(() => {
    let aborted = false;
    async function run() {
      try {
        if (requiresAuth) {
          const r = await fetch('/api/auth/status', { cache: 'no-store' });
          const js = await r.json().catch(() => ({}));
          if (!r.ok || js.authenticated === false) {
            if (!aborted) {
              setResolved('attention');
              setResolvedText('Sign in required');
            }
            return; // don't continue if not authed
          }
        }

        if (statusUrl) {
          const r2 = await fetch(statusUrl, { cache: 'no-store' });
          const js2: any = await r2.json().catch(() => ({}));
          if (!aborted) {
            if (r2.status === 401) {
              setResolved('attention');
              setResolvedText('Not connected');
            } else if (r2.ok) {
              // Heuristics: source may expose boolean fields
              const flag = js2?.connected ?? js2?.healthy ?? js2?.ok ?? js2?.status === 'ok';
              if (flag === false) {
                setResolved('attention');
                setResolvedText('Not connected');
              } else {
                setResolved('connected');
                setResolvedText('Connected');
              }
            } else {
              setResolved('error');
              setResolvedText('Error');
            }
          }
        }
      } catch {
        if (!aborted) {
          setResolved('error');
          setResolvedText('Error');
        }
      }
    }
    run();
    return () => { aborted = true; };
  }, [requiresAuth, statusUrl]);

  const badgeCls = badgeClass(resolved);
  const badgeText = resolvedText ?? defaultStatusText(resolved);

  const primary = actions.find((a) => a.primary) ?? actions[0];
  const secondary = actions.filter((a) => a !== primary);

  return (
    <article className={clsx("hz-card", className)}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {description ? <p>{description}</p> : null}

      <div className="hz-card__footer">
        {primary ? (
          <a className={clsx("hz-button", primary?.primary && "primary")} href={primary.href}>
            {primary.label}
          </a>
        ) : null}
        {secondary.map((act) => (
          <a key={act.label} className="hz-button" href={act.href}>
            {act.label}
          </a>
        ))}
        {badgeCls && badgeText ? <span className={badgeCls}>{badgeText}</span> : null}
      </div>
      {children}
    </article>
  );
}
