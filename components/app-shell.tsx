"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageTransition } from "@/components/page-transition";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onOpenMobile={() => setMobileOpen(true)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main
        className={`min-h-screen pt-14 transition-[margin-left] duration-300 ease-in-out md:pt-0 ${
          collapsed ? "md:ml-[70px]" : "md:ml-[260px]"
        }`}
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
