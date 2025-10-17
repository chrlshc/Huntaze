import AppSidebar from "@/src/components/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar />
      <main className="flex-1 transition-all duration-300">
        {children}
      </main>
    </>
  );
}