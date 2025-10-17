"use client";
import { signOut, useSession } from "next-auth/react";

import Input from "@/components/ui/Input";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";
import { Search } from "lucide-react";

export default function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-14 flex items-center gap-3 px-4 md:px-6">
        <div className="relative w-full md:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-9" />
        </div>
        <ThemeToggle />
        <div className="ml-auto flex items-center gap-3">
          {session?.user ? (
            <>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{session.user.name ?? session.user.email}</span>
                <span className="text-xs text-muted-foreground">{session.user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/signin" })}>
                Sign out
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Not signed in</div>
          )}
        </div>
      </div>
    </header>
  );
}
