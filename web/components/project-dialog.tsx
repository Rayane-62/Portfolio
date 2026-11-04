"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { IconChevron, IconClose, IconExternal } from "@/components/icons";
import type { Project, ProjectImage, ProjectSection } from "@/lib/api";

/**
 * Fenêtre de détail d'un projet. <dialog> natif : Échap ferme, le focus reste dedans.
 *  - galerie simple : un onglet par partie (« Site admin », « App livreurs »…) ;
 *  - projet avec sous-projets : une carte par sous-projet, un clic ouvre son détail.
 */
export function ProjectDialog({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const t = useTranslations("Projects");
  const ref = useRef<HTMLDialogElement>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const sub = p.hasSubprojects ? (p.sections.find((s) => s.id === subId) ?? null) : null;

  /* Pas de close() au démontage : en mode strict, React rejoue l'effet et
     l'événement « close » fermerait aussitôt la fenêtre. */
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  /* Changement de vue : on remonte en haut de la fenêtre. */
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [subId]);

  return (
    <dialog
      ref={ref}
      className="pd"
      aria-labelledby={`pd-title-${p.id}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="pd-inner">
        <header className="pd-head">
          <div>
            {sub ? (
              <button type="button" className="pd-back" onClick={() => setSubId(null)}>
                <IconChevron />
                {p.title}
              </button>
            ) : (
              <p className="pd-badges">
                <span className={`badge st-${p.status}`}>{t(`status.${p.status}`)}</span>
                {p.team && <span className="badge">{t("team")}</span>}
                {p.context && <span className="badge">{t(`context.${p.context}`)}</span>}
                {p.categories.length > 0 && (
                  <span className="kind">{p.categories.map((c) => t(`categories.${c}`)).join(" · ")}</span>
                )}
              </p>
            )}
            <h2 id={`pd-title-${p.id}`}>{sub ? sub.title : p.title}</h2>
            {sub && (sub.subtitle || sub.platforms.length > 0) && (
              <p className="pd-badges pd-under">
                {sub.platforms.map((pl) => (
                  <span className="badge" key={pl}>
                    {t(`platforms.${pl}`)}
                  </span>
                ))}
                {sub.subtitle && <span className="pd-sub-inline">{sub.subtitle}</span>}
              </p>
            )}
          </div>
          <button type="button" className="pd-close" onClick={() => ref.current?.close()} aria-label={t("close")}>
            <IconClose />
          </button>
        </header>

        {sub ? (
          <SubprojectView project={p} sub={sub} />
        ) : p.hasSubprojects && p.sections.length > 0 ? (
          <>
            <section aria-label={t("subprojects")}>
              <h3 className="pd-h">{t("subprojects")}</h3>
              <div className="pd-subs">
                {p.sections.map((s) => (
                  <SubCard key={s.id} sub={s} onOpen={() => setSubId(s.id)} />
                ))}
              </div>
            </section>
            <Details project={p} showParts={false} />
          </>
        ) : (
          <>
            <TabbedGallery project={p} />
            <Details project={p} showParts />
          </>
        )}
      </div>
    </dialog>
  );
}

/** Carte d'un sous-projet dans la fenêtre du projet. */
function SubCard({ sub, onOpen }: { sub: ProjectSection; onOpen: () => void }) {
  const t = useTranslations("Projects");
  const cover = sub.images[0];
  return (
    <button type="button" className="pd-subcard" onClick={onOpen}>
      <span className={`cover ${cover && cover.height > cover.width ? "is-portrait" : ""}`}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" loading="lazy" />
        ) : (
          <span className="glyph" aria-hidden="true">
            {sub.title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span className="info">
        <b>{sub.title}</b>
        {sub.subtitle && <span className="subt">{sub.subtitle}</span>}
        <span className="plats">
          {sub.platforms.map((pl) => (
            <span className="badge" key={pl}>
              {t(`platforms.${pl}`)}
            </span>
          ))}
          {sub.images.length > 0 && <span className="count">{t("shots", { count: sub.images.length })}</span>}
        </span>
        <span className="go">
          {t("openSub")}
          <IconChevron />
        </span>
      </span>
    </button>
  );
}

/** Détail d'un sous-projet : ses photos, sa description, ses fonctionnalités, sa stack. */
function SubprojectView({ project: p, sub }: { project: Project; sub: ProjectSection }) {
  const t = useTranslations("Projects");
  return (
    <>
      {sub.images.length > 0 ? (
        <Gallery key={sub.id} images={sub.images} label={`${p.title} — ${sub.title}`} />
      ) : (
        <p className="pd-empty">{t("noShots")}</p>
      )}
      <div className="pd-body">
        <div className="pd-main">
          <Paragraphs text={sub.description} />
          <List title={t("features")} items={sub.features} />
        </div>
        <aside className="pd-side">
          <Stack technologies={sub.technologies} />
          <Links liveUrl={sub.liveUrl} githubUrl={sub.githubUrl} />
        </aside>
      </div>
    </>
  );
}

/** Galerie simple : un onglet par partie qui a des photos. */
function TabbedGallery({ project: p }: { project: Project }) {
  const t = useTranslations("Projects");
  const [tab, setTab] = useState(0);
  const section = p.sections[tab];
  if (!section) return <p className="pd-empty">{t("noShots")}</p>;
  return (
    <section className="pd-gallery" aria-label={t("gallery")}>
      {p.sections.length > 1 && (
        <div className="pd-tabs" role="tablist" aria-label={t("parts")}>
          {p.sections.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={i === tab} onClick={() => setTab(i)}>
              {s.title}
              <span className="n">{s.images.length}</span>
            </button>
          ))}
        </div>
      )}
      {section.subtitle && <p className="pd-sub">{section.subtitle}</p>}
      <Gallery key={section.id} images={section.images} label={`${p.title} — ${section.title}`} />
    </section>
  );
}

/** Grande capture, flèches, miniatures, zoom au clic. Flèches du clavier pendant qu'elle est affichée. */
function Gallery({ images, label }: { images: ProjectImage[]; label: string }) {
  const t = useTranslations("Projects");
  const rtl = useLocale() === "ar";
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const image = images[index];
  const portrait = !!image && image.height > image.width;

  const go = (d: -1 | 1) => {
    if (images.length < 2) return;
    setIndex((i) => (i + d + images.length) % images.length);
    setZoom(false);
  };

  /* En arabe, la lecture va de droite à gauche : les flèches s'inversent. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if ((e.target as HTMLElement | null)?.closest?.("[role=tablist], input, textarea")) return;
      e.preventDefault();
      const forward = (e.key === "ArrowRight") !== rtl;
      if (images.length < 2) return;
      setIndex((i) => (i + (forward ? 1 : -1) + images.length) % images.length);
      setZoom(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, rtl]);

  if (!image) return null;
  return (
    <>
      <div className={`pd-stage ${zoom ? "is-zoom" : ""} ${portrait ? "is-portrait" : ""}`}>
        {/* images servies par l'API (URL absolue) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.id}
          src={image.url}
          width={image.width || undefined}
          height={image.height || undefined}
          alt={`${label} (${t("position", { n: index + 1, total: images.length })})`}
          onClick={() => setZoom((z) => !z)}
          title={zoom ? t("unzoom") : t("zoom")}
        />
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
    </>
  );
}

/** Description, fonctionnalités, points forts, parties, stack et liens du projet. */
function Details({ project: p, showParts }: { project: Project; showParts: boolean }) {
  const t = useTranslations("Projects");
  return (
    <div className="pd-body">
      <div className="pd-main">
        <Paragraphs text={p.description} />
        <List title={t("features")} items={p.features} />
        <List title={t("highlights")} items={p.highlights} />
      </div>
      <aside className="pd-side">
        {showParts && p.parts.length > 0 && (
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
        <Stack technologies={p.technologies} />
        <Links liveUrl={p.liveUrl} githubUrl={p.githubUrl} />
      </aside>
    </div>
  );
}

function Paragraphs({ text }: { text: string | null }) {
  const paragraphs = (text ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h3>{title}</h3>
      <ul className="pd-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  );
}

function Stack({ technologies }: { technologies: string[] }) {
  const t = useTranslations("Projects");
  if (!technologies.length) return null;
  return (
    <>
      <h3>{t("stack")}</h3>
      <div className="tags">
        {technologies.map((tech) => (
          <span className="tag" key={tech}>
            {tech}
          </span>
        ))}
      </div>
    </>
  );
}

function Links({ liveUrl, githubUrl }: { liveUrl: string | null; githubUrl: string | null }) {
  const t = useTranslations("Projects");
  if (!liveUrl && !githubUrl) return null;
  return (
    <div className="links">
      {liveUrl && (
        <a className="mini mini-accent" href={liveUrl} target="_blank" rel="noopener">
          <IconExternal />
          {t("ctaLive")}
        </a>
      )}
      {githubUrl && (
        <a className="mini" href={githubUrl} target="_blank" rel="noopener">
          <IconExternal />
          {t("ctaCode")}
        </a>
      )}
    </div>
  );
}
