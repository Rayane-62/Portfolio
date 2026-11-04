import type { SocialKey } from '../db/schema';

/** Numéro algérien : « +213 549 10 72 47 » → « 0549107247 ». */
export function normalizePhone(input: string): string {
  return input.replace(/[\s.\-()]/g, '').replace(/^\+213/, '0').replace(/^00213/, '0');
}

/** « 0549 10 72 47 » → « 213549107247 » pour les liens wa.me */
export function waNumber(phone: string): string {
  const d = normalizePhone(phone).replace(/\D/g, '');
  return d.startsWith('0') ? `213${d.slice(1)}` : d;
}

/** Adresse de chaque réseau, utilisée pour nettoyer le pseudo puis reconstruire le lien. */
const HOSTS: Record<SocialKey, RegExp> = {
  github: /^https?:\/\/(www\.)?github\.com\//i,
  linkedin: /^https?:\/\/([a-z]{2}\.|www\.)?linkedin\.com\/(in\/|company\/)?/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\//i,
  facebook: /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\//i,
  x: /^https?:\/\/(www\.)?(x|twitter)\.com\//i,
  youtube: /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i,
  tiktok: /^https?:\/\/(www\.|m\.)?tiktok\.com\/@?/i,
};

/**
 * Nettoie un compte social : retire l'URL complète, l'@ et la barre finale.
 * L'admin peut coller « https://github.com/Rayane-62 », « @Rayane-62 » ou « Rayane-62 »,
 * on garde toujours « Rayane-62 ». Vide = NULL = rien ne s'affiche sur le site.
 */
export function cleanHandle(input: string | null | undefined, kind: SocialKey): string | null {
  if (input == null) return null;
  let v = input.trim();
  if (!v) return null;
  v = v
    .replace(HOSTS[kind], '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '');
  if (kind === 'facebook') {
    // Facebook accepte des chemins (« pages/ma-page/123 ») : on les garde tels quels.
  } else if (kind === 'youtube') {
    // Une chaîne s'écrit « @pseudo », ou à l'ancienne « channel/UC… », « c/… », « user/… ».
    const parts = v.split('/');
    v = /^(channel|c|user)$/i.test(parts[0]) ? parts.slice(0, 2).join('/') : parts[0];
  } else {
    v = v.split('/')[0];
  }
  return v || null;
}

/** Pseudo → lien complet, prêt à mettre dans un href. NULL si le réseau est vide. */
export function socialUrl(kind: SocialKey, handle: string | null | undefined): string | null {
  const h = cleanHandle(handle, kind);
  if (!h) return null;
  const path = h.split('/').map(encodeURIComponent).join('/');
  switch (kind) {
    case 'github':
      return `https://github.com/${path}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${path}`;
    case 'instagram':
      return `https://www.instagram.com/${path}`;
    case 'facebook':
      return `https://www.facebook.com/${path}`;
    case 'x':
      return `https://x.com/${path}`;
    // Une chaîne YouTube s'écrit « @pseudo », sauf les anciennes adresses « channel/UC… » ou « c/… ».
    case 'youtube':
      return /^(channel|c|user)\//i.test(h) ? `https://www.youtube.com/${path}` : `https://www.youtube.com/@${path}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${path}`;
  }
}
