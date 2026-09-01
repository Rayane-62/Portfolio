"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import {
  HomeIcon,
  UserIcon,
  LayersIcon,
  FolderIcon,
  BriefcaseIcon,
  MailIcon,
  MenuIcon,
  XIcon,
  ChevronLeftIcon,
  SunIcon,
  MoonIcon,
} from "@/components/icons";

const NAV_ITEMS = [
  { id: "hero", label: "Accueil", icon: HomeIcon },
  { id: "about", label: "À propos", icon: UserIcon },
  { id: "skills", label: "Compétences", icon: LayersIcon },
  { id: "projects", label: "Projets", icon: FolderIcon },
  { id: "experience", label: "Expérience", icon: BriefcaseIcon },
  { id: "contact", label: "Contact", icon: MailIcon },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
};

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      {NAV_ITEMS.map(({ id, label, icon: ItemIcon }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={onCloseMobile}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
        >
          <ItemIcon className="size-5 shrink-0" />
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              collapsed ? "md:hidden md:opacity-0" : "opacity-100"
            }`}
          >
            {label}
          </span>
        </a>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 md:hidden">
        <span className="font-[Syne] text-lg font-bold text-[var(--text)]">
          Portfolio
        </span>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={onOpenMobile}
          className="flex size-9 items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--surface2)]"
        >
          <MenuIcon className="size-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--border)] bg-[var(--surface)] md:hidden"
          >
            <div className="flex h-14 items-center justify-between px-4">
              <span className="font-[Syne] text-lg font-bold text-[var(--text)]">
                Portfolio
              </span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={onCloseMobile}
                className="flex size-9 items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--surface2)]"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            {nav}
            <ThemeToggle isDark={isDark} setTheme={setTheme} collapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 260 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex"
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <span className="font-[Syne] text-lg font-bold text-[var(--text)]">
              Portfolio
            </span>
          )}
          <button
            type="button"
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            onClick={onToggleCollapsed}
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <ChevronLeftIcon
              className={`size-4 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        {nav}
        <ThemeToggle isDark={isDark} setTheme={setTheme} collapsed={collapsed} />
      </motion.aside>
    </>
  );
}

function ThemeToggle({
  isDark,
  setTheme,
  collapsed,
}: {
  isDark: boolean;
  setTheme: (t: string) => void;
  collapsed: boolean;
}) {
  return (
    <div className="border-t border-[var(--border)] p-3">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
      >
        {isDark ? (
          <SunIcon className="size-5 shrink-0" />
        ) : (
          <MoonIcon className="size-5 shrink-0" />
        )}
        <span className={collapsed ? "md:hidden" : ""}>
          {isDark ? "Mode clair" : "Mode sombre"}
        </span>
      </button>
    </div>
  );
}
