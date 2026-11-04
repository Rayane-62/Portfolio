"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { IconChevron, IconClose, IconExternal } from "@/components/icons";
import type { Project } from "@/lib/api";

/**
 * Fenêtre de détail d'un projet : un onglet par partie (« Site admin »,
 * « App livreurs »…), une grande capture avec flèches, les miniatures,
 * puis la description, les fonctionnalités et la stack.
 * <dialog> natif : Échap ferme, le focus reste dans la fenêtre.
 */
export function ProjectDialog({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const t = useTranslations("Projects");
  const rtl = useLocale() === "ar";
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  /* Pas de close() au démontage : en mode strict, React rejoue l'effet et
     l'événement « close » fermerait aussitôt la fenêtre. */
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const section = p.sections[tab];
  const images = section?.images ?? [];
  const image = images[index];
  const portrait = !!image && image.height > image.width;

  const go = (d: -1 | 1) => {
    if (images.length < 2) return;
    setIndex((i) => (i + d + images.length) % images.length);
    setZoom(false);
  };
  const pickTab = (i: number) => {
    setTab(i);
    setIndex(0);
    setZoom(false);
  };

  /* Flèches du clavier : en arabe, la lecture va de droite à gauche. */
  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if ((e.target as HTMLElement).closest("[role=tablist]")) return;
    e.preventDefault();
    go((e.key === "ArrowRight") !== rtl ? 1 : -1);
  }

  const paragraphs = (p.description ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

  return (
    <dialog
      ref={ref}
      className="pd"
      aria-labelledby={`pd-title-${p.id}`}
      onClose={onClose}
      onKeyDown={onKey}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="pd-inner">
        <header className="pd-head">
          <div>
            <p className="pd-badges">
              <span className={`badge st-${p.status}`}>{t(`status.${p.status}`)}</span>
              {p.team && <span className="badge">{t("team")}</span>}
              {p.context && <span className="badge">{t(`context.${p.context}`)}</span>}
              {p.categories.length > 0 && (
                <span className="kind">{p.categories.map((c) => t(`categories.${c}`)).join(" · ")}</span>
              )}
            </p>
            <h2 id={`pd-title-${p.id}`}>{p.title}</h2>
          </div>
          <button type="button" className="pd-close" onClick={() => ref.current?.close()} aria-label={t("close")}>
            <IconClose />
          </button>
        </header>

        {p.sections.length > 0 ? (
          <section className="pd-gallery" aria-label={t("gallery")}>
            {p.sections.length > 1 && (
              <div className="pd-tabs" role="tablist" aria-label={t("parts")}>
                {p.sections.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === tab}
                    onClick={() => pickTab(i)}
                  >
                    {s.title}
                    <span className="n">{s.images.length}</span>
                  </button>
                ))}
              </div>
            )}
            {section?.subtitle && <p className="pd-sub">{section.subtitle}</p>}

            <div className={`pd-stage ${zoom ? "is-zoom" : ""} ${portrait ? "is-portrait" : ""}`}>
              {image && (
                // images servies par l'API (URL absolue)
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={image.url}
                  width={image.width || undefined}
                  height={image.height || undefined}
                  alt={`${p.title} — ${section.title} (${t("position", { n: index + 1, total: images.length })})`}
                  onClick={() => setZoom((z) => !z)}
                  title={zoom ? t("unzoom") : t("zoom")}
                />
              )}
              {images.length > 1 && (
                <>
                  <button type="button" className="pd-nav prev" onClick={() => go(-1)} aria-label={t("prev")}>
                    <IconChevron />
                  </button>
                  <button type="button" className="pd-nav next" onClick={() => go(1)} aria-label={t("next")}>
                    <IconChevron />
                  </button>
                </>
              )}
              <span className="pd-count" aria-live="polite">
                {t("position", { n: index + 1, total: images.length })}
              </span>
            </div>

            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    aria-label={t("position", { n: i + 1, total: images.length })}
                    aria-current={i === index}
                    className={img.height > img.width ? "is-portrait" : undefined}
                    onClick={() => {
                      setIndex(i);
                      setZoom(false);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <p className="pd-empty">{t("noShots")}</p>
        )}

        <div className="pd-body">
          <div className="pd-main">
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {p.features.length > 0 && (
              <>
                <h3>{t("features")}</h3>
                <ul className="pd-list">
                  {p.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
            {p.highlights.length > 0 && (
              <>
                <h3>{t("highlights")}</h3>
                <ul className="pd-list">
                  {p.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="pd-side">
            {p.parts.length > 0 && (
              <>
                <h3>{t("parts")}</h3>
                <ul className="pd-parts">
                  {p.parts.map((part, i) => (
                    <li key={i}>
                      <b>{part.title}</b>
                      {part.subtitle && <span>{part.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {p.technologies.length > 0 && (
              <>
                <h3>{t("stack")}</h3>
                <div className="tags">
                  {p.technologies.map((tech) => (
                    <span className="tag" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
              </>
            )}
            {(p.liveUrl || p.githubUrl) && (
              <div className="links">
                {p.liveUrl && (
                  <a className="mini mini-accent" href={p.liveUrl} target="_blank" rel="noopener">
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
            )}
          </aside>
        </div>
      </div>
    </dialog>
  );
}
