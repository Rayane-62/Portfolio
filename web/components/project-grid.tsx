"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IconExternal } from "@/components/icons";
import { ProjectDialog } from "@/components/project-dialog";
import { ProjectThumb } from "@/components/project-thumb";
import type { Project } from "@/lib/api";

const MAX_TAGS = 5;

/** Les cartes de la section Projets ; un clic ouvre la fenêtre de détail. */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  const t = useTranslations("Projects");
  const [openId, setOpenId] = useState<number | null>(null);
  const open = projects.find((p) => p.id === openId) ?? null;

  return (
    <>
      <div className="proj-grid z-in" style={{ "--i": 2 } as React.CSSProperties}>
        {projects.map((p) => {
          const shots = p.sections.reduce((n, s) => n + s.images.length, 0);
          const extra = p.technologies.length - MAX_TAGS;
          return (
            <article className="card proj" key={p.id}>
              <button
                type="button"
                className="thumb-btn"
                onClick={() => setOpenId(p.id)}
                aria-label={`${t("ctaDetails")} : ${p.title}`}
              >
                <ProjectThumb title={p.title} imageUrl={p.coverUrl} />
                <span className="badges">
                  <span className={`badge st-${p.status}`}>{t(`status.${p.status}`)}</span>
                  {p.team && <span className="badge">{t("team")}</span>}
                </span>
              </button>
              <div className="body">
                {p.categories.length > 0 && (
                  <p className="kind">{p.categories.map((c) => t(`categories.${c}`)).join(" · ")}</p>
                )}
                <h3>{p.title}</h3>
                {p.summary && <p>{p.summary}</p>}
                {p.technologies.length > 0 && (
                  <div className="tags">
                    {p.technologies.slice(0, MAX_TAGS).map((tech) => (
                      <span className="tag" key={tech}>
                        {tech}
                      </span>
                    ))}
                    {extra > 0 && <span className="tag more">+{extra}</span>}
                  </div>
                )}
                {(p.parts.length > 1 || shots > 0) && (
                  <p className="meta">
                    {[
                      p.parts.length > 1 ? t("partsCount", { count: p.parts.length }) : null,
                      shots > 0 ? t("shots", { count: shots }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <div className="links">
                  <button type="button" className="mini mini-accent" onClick={() => setOpenId(p.id)}>
                    {t("ctaDetails")}
                  </button>
                  {p.liveUrl && (
                    <a className="mini" href={p.liveUrl} target="_blank" rel="noopener">
                      <IconExternal />
                      {t("ctaLive")}
                    </a>
                  )}
                  {p.githubUrl && (
                    <a className="mini" href={p.githubUrl} target="_blank" rel="noopener">
                      <IconExternal />
                      {t("ctaCode")}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {open && <ProjectDialog key={open.id} project={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
