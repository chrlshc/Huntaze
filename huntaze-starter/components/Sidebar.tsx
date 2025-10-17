"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Settings, Link2, Send, PanelsTopLeft, type LucideIcon } from "lucide-react";

type NavEntry = {
  label: string
  href?: string
  icon?: LucideIcon
  items?: NavEntry[]
}

const nav: NavEntry[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "OnlyFans", items: [] },
  {
    label: "Social Media",
    items: [
      { label: "Planner", href: "/marketing/planner", icon: Send },
      { label: "Tracking Links", href: "/marketing/funnels", icon: Link2 }
    ]
  },
  { label: "Manager AI (CIN)", href: "/manager", icon: PanelsTopLeft }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-card/50">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded bg-brand" />
          <span>Huntaze</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {nav.map((section, idx) => (
          <div key={idx}>
            <div className="px-2 py-2 text-xs uppercase tracking-wide text-muted-foreground">{section.label}</div>
            {section.items?.length ? (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted",
                        active && "bg-muted text-foreground"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100" />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : section.href ? (
              <Link
                href={section.href}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted",
                  pathname === section.href && "bg-muted text-foreground"
                )}
              >
                {section.icon && <section.icon className="h-4 w-4 opacity-70 group-hover:opacity-100" />}
                <span>{section.label}</span>
              </Link>
            ) : (
              <div className="px-2 py-1 text-sm text-muted-foreground/80">Coming soon</div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
