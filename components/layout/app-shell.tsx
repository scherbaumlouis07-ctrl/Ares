"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

const SHELL_LESS_PATHS = ["/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (SHELL_LESS_PATHS.includes(pathname ?? "")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
