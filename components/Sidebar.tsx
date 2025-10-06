"use client";

import NavLink from "@/components/ui/NavLink";

export default function Sidebar() {
  return (
    <aside className="h-full min-h-[calc(100vh-56px)] bg-[rgb(var(--color-sidebar-bg))] text-[rgb(var(--color-sidebar-fg))] border-r border-black/5 md:sticky md:top-14">
      <div className="px-4 py-4">
        <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Navigation</div>
        <ul className="space-y-1">
          <li>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </li>
          <li>
            <NavLink href="/messages">Messages</NavLink>
          </li>
          <li>
            <NavLink href="/analytics">Analytics</NavLink>
          </li>
        </ul>
      </div>
    </aside>
  );
}

