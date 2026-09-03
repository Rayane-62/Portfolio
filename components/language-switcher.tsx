"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { GlobeIcon } from "@/components/icons";

export function LanguageSwitcher({ collapsed }: { collapsed: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <GlobeIcon className="size-5 shrink-0" />
      </div>

      <div className={`grid grid-cols-4 gap-1.5 ${collapsed ? "md:hidden" : ""}`}>
        {routing.locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={l === locale}
            className={`rounded-md py-1.5 text-xs font-semibold uppercase transition-colors ${
              l === locale
                ? "bg-[var(--accent)] text-[var(--bg)] shadow-[0_0_16px_var(--glass-glow)]"
                : "text-[var(--text-muted)] hover:bg-[var(--glass-hover-bg)] hover:text-[var(--text)]"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
