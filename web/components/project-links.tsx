"use client";

import { useTranslations } from "next-intl";
import { IconDownload, IconExternal } from "@/components/icons";
import type { ProjectLinkSet } from "@/lib/api";

/** Boutons d'un projet ou d'un sous-projet : site, stores, téléchargement, dépôts. Un lien vide = pas de bouton. */
export function ProjectLinks({
  links,
  accent = true,
  primaryOnly = false,
}: {
  links: ProjectLinkSet;
  accent?: boolean;
  /** Cartes : seulement le 1er lien utile (site, store ou téléchargement), sans les dépôts. */
  primaryOnly?: boolean;
}) {
  const t = useTranslations("Projects");
  const items: { href: string; label: string; download?: boolean }[] = [];
  if (links.liveUrl) items.push({ href: links.liveUrl, label: t("ctaLive") });
  if (links.playStoreUrl) items.push({ href: links.playStoreUrl, label: "Google Play" });
  if (links.appStoreUrl) items.push({ href: links.appStoreUrl, label: "App Store" });
  if (links.downloadUrl) items.push({ href: links.downloadUrl, label: t("ctaDownload"), download: true });
  if (primaryOnly) items.splice(1);
  else for (const r of links.repos) items.push({ href: r.url, label: r.label ? `${t("ctaCode")} · ${r.label}` : t("ctaCode") });
  if (!items.length) return null;

  return (
    <>
      {items.map((it, i) => (
        <a
          key={it.href + i}
          className={`mini ${accent && i === 0 && !it.label.startsWith(t("ctaCode")) ? "mini-accent" : ""}`}
          href={it.href}
          target="_blank"
          rel="noopener"
        >
          {it.download ? <IconDownload /> : <IconExternal />}
          {it.label}
        </a>
      ))}
    </>
  );
}

export function hasLinks(l: ProjectLinkSet) {
  return !!(l.liveUrl || l.playStoreUrl || l.appStoreUrl || l.downloadUrl || l.repos.length);
}
