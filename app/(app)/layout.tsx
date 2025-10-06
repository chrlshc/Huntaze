import type { Metadata } from "next";
import "../globals.css";
import "../../styles/tokens.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Huntaze App",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-content-bg))]">
      <Header />
      <div className="grid grid-cols-12">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2" data-sidebar-skin="white">
          <Sidebar />
        </aside>
        <main id="main" className="col-span-12 md:col-span-9 lg:col-span-10 bg-[rgb(var(--color-content-bg))]">
          <div className="mx-auto max-w-screen-2xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

