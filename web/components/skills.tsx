"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Scramble } from "@/components/scramble";
import type { SkillCategory, SkillGroups } from "@/lib/api";

const CATEGORIES: SkillCategory[] = ["frontend", "backend", "mobile", "tools"];
type Filter = "all" | SkillCategory;

/** Deux lettres de secours quand le logo distant ne charge pas. */
function abbr(name: string) {
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "··";
}

function SkillIcon({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(!url);
  const ref = useRef<HTMLImageElement | null>(null);

  /* Le logo peut échouer avant l'hydratation : `onError` est alors passé.
     On rattrape le cas en relisant l'état de l'image au montage. */
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || !url) return <span className="mono-fb">{abbr(name)}</span>;
  return (
    // les logos viennent du CDN devicon : hôte externe, balise simple
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={url}
      alt=""
      loading="lazy"
      width={30}
      height={30}
      onError={() => setFailed(true)}
    />
  );
}

export function Skills({ skills }: { skills: SkillGroups }) {
  const t = useTranslations("Skills");
  const [filter, setFilter] = useState<Filter>("all");

  const flat = useMemo(
    () =>
      CATEGORIES.flatMap((cat) =>
        (skills[cat] ?? []).map((s) => ({ ...s, category: cat }))
      ),
    [skills]
  );

  const shown = flat.filter((s) => filter === "all" || s.category === filter);
  const available = CATEGORIES.filter((c) => (skills[c] ?? []).length > 0);

  if (flat.length === 0) return null;

  return (
    <section className="block z" id="skills">
      <div className="wrap">
        <p className="eyebrow">{t("eyebrow")}</p>
        <Scramble as="h2" className="title z-in" text={t("title")} />
        <p className="lede z-in" style={{ "--i": 1 } as React.CSSProperties}>
          {t("description")}
        </p>

        <div
          className="filters z-in"
          style={{ "--i": 2 } as React.CSSProperties}
          role="group"
          aria-label={t("filterLabel")}
        >
          {(["all", ...available] as Filter[]).map((cat) => (
            <button
              type="button"
              key={cat}
              className="filter"
              aria-pressed={filter === cat}
              onClick={() => setFilter(cat)}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        <div
          className="skill-grid z-in"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          {shown.map((s) => (
            <div className="skill" key={s.id} title={s.name}>
              <SkillIcon name={s.name} url={s.iconUrl} />
              <b>{s.name}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
