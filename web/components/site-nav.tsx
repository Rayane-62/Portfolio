"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTheme } from "@/hooks/use-theme";
import {
  IconClose,
  IconGlobe,
  IconMenu,
  IconMoon,
  IconSun,
} from "@/components/icons";

const SECTIONS = [
  "hero",
  "about",
  "skills",
  "experience",
  "education",
  "projects",
  "contact",
] as const;

const LANG_NAMES: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  ar: "العربية",
};

export function SiteNav({ initials }: { initials: string }) {
  const t = useTranslations("Nav");
  const tUi = useTranslations("Ui");
  const locale = useLocale();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const [stuck, setStuck] = useState(false);
  const [current, setCurrent] = useState<string>("hero");
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  // barre collée + lien actif
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setStuck(window.scrollY > 24);
        let cur = "hero";
        for (const id of SECTIONS) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 120) cur = id;
        }
        setCurrent(cur);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // fermer les panneaux au clic extérieur / Échap
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <>
      {/* le menu ouvert pose le fond de la barre : le panneau ne flotte pas
          sous un en-tête transparent */}
      <header className={`nav${stuck || menuOpen ? " stuck" : ""}`}>
        <a className="brand" href="#hero">
          <span className="brand-mark" aria-hidden="true">
            {initials}
          </span>
          <span className="brand-txt">
            BENLALAM<i>.dev</i>
          </span>
        </a>

        <nav aria-label={tUi("mainNav")}>
          <ul className="nav-links">
            {SECTIONS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={current === id ? "true" : undefined}
                >
                  {t(id)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-tools">
          <div className="lang" ref={langRef}>
            <button
              type="button"
              className="lang-btn"
              aria-haspopup="true"
              aria-expanded={langOpen}
              aria-label={tUi("changeLanguage")}
              onClick={() => setLangOpen((v) => !v)}
            >
              <IconGlobe />
              <span>{locale.toUpperCase()}</span>
            </button>
            {langOpen && (
              <ul className="lang-menu">
                {routing.locales.map((l) => (
                  <li key={l}>
                    <Link
                      href={pathname}
                      locale={l}
                      aria-current={l === locale ? "true" : undefined}
                      onClick={() => setLangOpen(false)}
                    >
                      {LANG_NAMES[l]}
                      <span className="code">{l.toUpperCase()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="icon-btn"
            aria-label={isDark ? tUi("themeLight") : tUi("themeDark")}
            aria-pressed={!isDark}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <IconMoon /> : <IconSun />}
          </button>

          <button
            type="button"
            className="icon-btn burger"
            aria-label={menuOpen ? tUi("closeMenu") : tUi("openMenu")}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-panel">
          <ul>
            {SECTIONS.map((id) => (
              <li key={id}>
                <a href={`#${id}`} onClick={() => setMenuOpen(false)}>
                  {t(id)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
