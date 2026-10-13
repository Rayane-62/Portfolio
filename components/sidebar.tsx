"use client";

import { useTheme, type Theme } from "@/hooks/use-theme";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SocialLinks } from "@/components/social-links";
import {
  HomeIcon,
  UserIcon,
  LayersIcon,
  FolderIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  MailIcon,
  MenuIcon,
  XIcon,
  ChevronLeftIcon,
  SunIcon,
  MoonIcon,
} from "@/components/icons";

const NAV_ITEMS = [
  { id: "hero", icon: HomeIcon },
  { id: "about", icon: UserIcon },
  { id: "skills", icon: LayersIcon },
  { id: "projects", icon: FolderIcon },
  { id: "experience", icon: BriefcaseIcon },
  { id: "education", icon: GraduationCapIcon },
  { id: "contact", icon: MailIcon },
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
  const tNav = useTranslations("Nav");
  const tSidebar = useTranslations("Sidebar");

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      {NAV_ITEMS.map(({ id, icon: ItemIcon }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={onCloseMobile}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-hover-bg)] hover:text-[var(--text)]"
        >
          <ItemIcon className="size-5 shrink-0" />
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              collapsed ? "md:hidden md:opacity-0" : "opacity-100"
            }`}
          >
            {tNav(id)}
          </span>
        </a>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--sidebar-glass-border)] bg-[var(--sidebar-glass-bg)] px-4 backdrop-blur-[20px] md:hidden">
        <span className="font-[Syne] text-lg font-bold text-[var(--text)]">
          Portfolio
        </span>
        <button
          type="button"
          aria-label={tSidebar("openMenu")}
          onClick={onOpenMobile}
          className="flex size-9 items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--glass-hover-bg)]"
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
            className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--sidebar-glass-border)] bg-[var(--sidebar-glass-bg)] backdrop-blur-[20px] md:hidden"
          >
            <div className="flex h-14 items-center justify-between px-4">
              <span className="font-[Syne] text-lg font-bold text-[var(--text)]">
                Portfolio
              </span>
              <button
                type="button"
                aria-label={tSidebar("closeMenu")}
                onClick={onCloseMobile}
                className="flex size-9 items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--glass-hover-bg)]"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            {nav}
            <SidebarFooter isDark={isDark} setTheme={setTheme} collapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 260 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[var(--sidebar-glass-border)] bg-[var(--sidebar-glass-bg)] backdrop-blur-[20px] md:flex"
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <span className="font-[Syne] text-lg font-bold text-[var(--text)]">
              Portfolio
            </span>
          )}
          <button
            type="button"
            aria-label={
              collapsed ? tSidebar("expandMenu") : tSidebar("collapseMenu")
            }
            onClick={onToggleCollapsed}
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--glass-hover-bg)] hover:text-[var(--text)]"
          >
            <ChevronLeftIcon
              className={`size-4 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        {nav}
        <SidebarFooter isDark={isDark} setTheme={setTheme} collapsed={collapsed} />
      </motion.aside>
    </>
  );
}

function SidebarFooter({
  isDark,
  setTheme,
  collapsed,
}: {
  isDark: boolean;
  setTheme: (t: Theme) => void;
  collapsed: boolean;
}) {
  const t = useTranslations("Sidebar");

  return (
    <div className="flex flex-col gap-1 border-t border-[var(--glass-border)] p-3">
      <LanguageSwitcher collapsed={collapsed} />
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-hover-bg)] hover:text-[var(--text)]"
      >
        {isDark ? (
          <SunIcon className="size-5 shrink-0" />
        ) : (
          <MoonIcon className="size-5 shrink-0" />
        )}
        <span className={collapsed ? "md:hidden" : ""}>
          {isDark ? t("themeLight") : t("themeDark")}
        </span>
      </button>
      <SocialLinks />
    </div>
  );
}
