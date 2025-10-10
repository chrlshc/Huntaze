import type { PropsWithChildren, ReactNode } from "react";

import { Header } from "@/components/Header";
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
        <Header title={title} breadcrumb={breadcrumb} actions={headerActions} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
