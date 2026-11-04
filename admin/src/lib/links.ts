import type { ProjectCategory, Repo } from './types';

/** Les liens d'un projet ou d'un sous-projet, tels qu'ils sont saisis dans l'admin. */
export interface LinksValue {
  liveUrl: string;
  playStoreUrl: string;
  appStoreUrl: string;
  downloadUrl: string;
  /** Toujours 2 lignes dans le formulaire ; les lignes vides ne sont pas envoyées. */
  repos: Repo[];
}

type Linkable = { liveUrl: string | null; playStoreUrl: string | null; appStoreUrl: string | null; downloadUrl: string | null; repos: Repo[] };

export function linksOf(x: Linkable): LinksValue {
  const repos = [...(x.repos ?? [])].slice(0, 2);
  while (repos.length < 2) repos.push({ label: '', url: '' });
  return {
    liveUrl: x.liveUrl ?? '',
    playStoreUrl: x.playStoreUrl ?? '',
    appStoreUrl: x.appStoreUrl ?? '',
    downloadUrl: x.downloadUrl ?? '',
    repos: repos.map((r) => ({ label: r.label ?? '', url: r.url ?? '' })),
  };
}

/**
 * Corps envoyé à l'API. Un lien qui ne correspond plus au type choisi est vidé
 * (ex. un lien App Store sur un sous-projet devenu « Web »).
 */
export function linksPayload(v: LinksValue, kinds: ProjectCategory[]) {
  const all = kinds.length === 0;
  const has = (k: ProjectCategory) => all || kinds.includes(k);
  return {
    liveUrl: has('web') ? v.liveUrl.trim() : '',
    playStoreUrl: has('mobile') ? v.playStoreUrl.trim() : '',
    appStoreUrl: has('mobile') ? v.appStoreUrl.trim() : '',
    downloadUrl: has('desktop') ? v.downloadUrl.trim() : '',
    repos: v.repos.map((r) => ({ label: r.label.trim(), url: r.url.trim() })).filter((r) => r.url),
  };
}

/** Message d'erreur à afficher, ou '' si tout est bon. */
export function linksError(v: LinksValue): string {
  const urls = [v.liveUrl, v.playStoreUrl, v.appStoreUrl, v.downloadUrl, ...v.repos.map((r) => r.url)];
  if (urls.some((u) => u.trim() && !/^https?:\/\//.test(u.trim()))) return 'Les liens doivent commencer par https://';
  if (v.repos.some((r) => r.label.trim() && !r.url.trim())) return 'Un dépôt a un nom mais pas de lien.';
  return '';
}
