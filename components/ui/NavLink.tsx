"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  const cls = [
    "block rounded px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2",
    "ring-[rgb(var(--color-brand-300))] ring-offset-2 ring-offset-[rgb(var(--color-ring-offset))]",
    // hover variants per sidebar skin
    "[data-sidebar-skin=white]:hover:bg-black/[0.04]",
    "[data-sidebar-skin=violet]:hover:bg-white/10",
    // active variants
    active ? "font-medium" : "",
    active ? "[data-sidebar-skin=white]:bg-black/[0.06] [data-sidebar-skin=violet]:bg-white/15" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cls}>
      {children}
    </Link>
  );
}
