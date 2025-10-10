"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Camera, Music, MessageSquare, BarChart3, Shield, HandCoins } from "lucide-react";

type Status = "loading" | "connected" | "attention" | "error";

export type NodeDef = {
  id: string;
  title: string;
  statusUrl?: string;
  connectHref?: string;
  connectLabel?: string;
  x: number; // 0..100 (percent)
  y: number; // 0..100 (percent)
};

export type LinkDef = { from: string; to: string };

type NodeState = Record<string, Status>;

const DEFAULT_NODES: NodeDef[] = [
  { id: "hub", title: "Huntaze", x: 50, y: 50 },
  { id: "instagram", title: "Instagram", statusUrl: "/api/social/instagram/status", connectHref: "/auth/instagram", x: 18, y: 28 },
  { id: "tiktok", title: "TikTok", statusUrl: "/api/social/tiktok/status", connectHref: "/auth/tiktok", x: 82, y: 28 },
  { id: "reddit", title: "Reddit", statusUrl: "/api/social/reddit/status", connectHref: "/auth/reddit", x: 50, y: 84 },
];

const DEFAULT_LINKS: LinkDef[] = [
  { from: "hub", to: "instagram" },
  { from: "hub", to: "tiktok" },
  { from: "hub", to: "reddit" },
];

export default function ConnectorGraph({
  nodes = DEFAULT_NODES,
  links = DEFAULT_LINKS,
  size = { w: 800, h: 420 },
  layout = 'grid', // 'grid' | 'row'
  hideStatus = false,
  hideActions = false,
  includeHub = true,
  cardWidth,
}: {
  nodes?: NodeDef[];
  links?: LinkDef[];
  size?: { w: number; h: number };
  layout?: 'grid' | 'row';
  hideStatus?: boolean;
  hideActions?: boolean;
  includeHub?: boolean;
  cardWidth?: number;
}) {
  const [status, setStatus] = useState<NodeState>({});

  // Fetch statuses on mount for nodes that expose statusUrl
  useEffect(() => {
    let aborted = false;
    async function run() {
      try {
        const withUrl = nodes.filter((n) => !!n.statusUrl);
        const entries = await Promise.all(
          withUrl.map(async (n) => {
            try {
              const r = await fetch(n.statusUrl!, { cache: "no-store" });
              const js: any = await r.json().catch(() => ({}));
              if (!r.ok) {
                return [n.id, r.status === 401 ? ("attention" as Status) : ("error" as Status)] as const;
              }
              const connected = js?.connected === true || js?.ok === true || js?.healthy === true || js?.status === "ok";
              return [n.id, connected ? ("connected" as Status) : ("attention" as Status)] as const;
            } catch {
              return [n.id, "error"] as const;
            }
          }),
        );
        if (!aborted) {
          const next: NodeState = {};
          for (const [id, st] of entries) next[id] = st;
          setStatus(next);
        }
      } catch {
        if (!aborted) setStatus({});
      }
    }
    run();
    return () => {
      aborted = true;
    };
  }, [nodes]);

  const points = useMemo(() => {
    const activeNodes = (includeHub ? nodes : nodes.filter(n => n.id !== 'hub'));
    const map: Record<string, { x: number; y: number }> = {};
    if (layout === 'row') {
      const row = activeNodes.filter(n => n.id !== 'hub');
      const count = row.length;
      const step = 100 / (count + 1);
      row.forEach((n, i) => {
        map[n.id] = { x: ((i + 1) * step / 100) * size.w, y: (0.5) * size.h };
      });
      if (includeHub) {
        map['hub'] = { x: 0.5 * size.w, y: 0.5 * size.h };
      }
    } else {
      for (const n of activeNodes) {
        map[n.id] = { x: (n.x / 100) * size.w, y: (n.y / 100) * size.h };
      }
    }
    return map;
  }, [nodes, includeHub, layout, size.w, size.h]);

  return (
    <div className="hz-graph" style={{ position: "relative" }}>
      <svg className="hz-graph-svg" width="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
        {(layout === 'row' ? [] : links).map((lk) => {
          const st = status[lk.to] === 'connected' ? 'connected' : 'attention';
          const a = points[lk.from];
          const b = points[lk.to];
          if (!a || !b) return null;
          return (
            <line key={`${lk.from}-${lk.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={clsx("hz-link", `hz-link--${st}`)} />
          );
        })}
      </svg>

      {(includeHub ? nodes : nodes.filter(n => n.id !== 'hub')).map((n) => (
        <Node key={n.id} def={n} status={status[n.id]} hideStatus={hideStatus} hideActions={hideActions} cardWidth={cardWidth} />
      ))}
    </div>
  );
}

function Node({ def, status, hideStatus, hideActions, cardWidth }: { def: NodeDef; status?: Status; hideStatus?: boolean; hideActions?: boolean; cardWidth?: number }) {
  const width = cardWidth ?? 180;
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${def.x}%`,
    top: `${def.y}%`,
    transform: 'translate(-50%, -50%)',
    width,
    pointerEvents: "auto",
  };

  if (def.id === "hub") {
    return (
      <div className="hz-node hz-node--hub" style={style} aria-label={`${def.title} hub`}>
        <div className="hz-node-title">{def.title}</div>
      </div>
    );
  }

  const Icon = pickIcon(def.id);
  const badgeCls = hideStatus ? undefined : (status ? `hz-badge hz-badge--${status === "connected" ? "success" : status === "error" ? "critical" : status === "loading" ? "attention" : "attention"}` : undefined);
  const badgeText = hideStatus ? undefined : (status === "connected" ? "Connected" : status === "error" ? "Error" : status === "loading" ? "Loading" : undefined);

  return (
    <div className="hz-node" style={style} role="group" aria-label={`${def.title} connector`}>
      <div className="hz-node-card">
        <div className="hz-node-row">
          <div className="hz-node-icon"><Icon size={16} /></div>
          <div className="hz-node-title">{def.title}</div>
          {badgeCls && badgeText ? <span className={badgeCls} style={{ marginLeft: "auto" }}>{badgeText}</span> : null}
        </div>
        {hideActions ? null : (
          <div className="hz-card__footer" style={{ marginTop: 8 }}>
            <a className="hz-button primary" href={def.connectHref || "#"}>
              {def.connectLabel ?? "Connect"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function pickIcon(id: string) {
  switch (id) {
    case "instagram":
      return Camera;
    case "tiktok":
      return Music;
    case "reddit":
      return MessageSquare;
    case "analytics":
    case "overview":
    case "revenue":
    case "acquisition":
      return BarChart3;
    case "compliance":
      return Shield;
    case "payments":
      return HandCoins;
    default:
      return MessageSquare;
  }
}
