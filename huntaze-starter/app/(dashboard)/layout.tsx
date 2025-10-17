import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { authOptions } from "@/lib/auth/options";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="md:flex">
        <Sidebar />
        <div className="flex-1">
          <Topbar />
          <main className="px-4 py-4 sm:px-6 sm:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
