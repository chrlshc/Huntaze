import type { PropsWithChildren, ReactNode } from "react";

import Header from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

type DashboardLayoutProps = PropsWithChildren<{
  title: string;
  breadcrumb?: ReactNode;
  headerActions?: ReactNode;
}>;

export function DashboardLayout({ title, breadcrumb, headerActions, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <div className="p-6">
          {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {headerActions && <div>{headerActions}</div>}
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
