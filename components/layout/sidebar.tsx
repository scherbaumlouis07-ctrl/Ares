"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-[236px] shrink-0 h-screen sticky top-0 flex flex-col bg-surface border-r border-border">
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <span className="text-sm font-semibold tracking-[0.2em] text-text">ARES OS</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "bg-elevated text-text"
                  : "text-text-secondary hover:text-text hover:bg-elevated/60"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1.5 bottom-1.5 w-[2px] transition-colors duration-150",
                  active ? "bg-critical" : "bg-transparent"
                )}
              />
              <Icon size={16} strokeWidth={1.75} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 shrink-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted">
          <Settings size={16} strokeWidth={1.75} />
          <span>Settings / System</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:text-text hover:bg-elevated/60 transition-colors duration-150"
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
