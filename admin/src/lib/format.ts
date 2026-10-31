import type { Locale, ProjectCategory, SkillCategory, SocialKey } from './types';

export function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

/** « Aujourd'hui · 14:32 », « Hier · 19:45 », « 12 oct. · 10:02 » */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0) return `Aujourd'hui · ${time}`;
  if (diff === 1) return `Hier · ${time}`;
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return `${d.toLocaleDateString('fr-FR', opts)} · ${time}`;
}

/** « il y a 5 min », « il y a 3 h », « il y a 2 j » */
export function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

// ─── Les 4 langues du site ──────────────────────────────────────────────────

export const LOCALES: Locale[] = ['fr', 'en', 'es', 'ar'];

export const LANGS: Record<Locale, { label: string; name: string; rtl?: boolean }> = {
  fr: { label: 'FR', name: 'Français' },
  en: { label: 'EN', name: 'Anglais' },
  es: { label: 'ES', name: 'Espagnol' },
  ar: { label: 'AR', name: 'Arabe', rtl: true },
};

/**
 * Nom de la colonne d'un champ pour une langue : ('title', 'en') → 'titleEn'.
 * Le français est la colonne de base, les trois autres sont des traductions facultatives.
 */
export function locField<T extends string>(field: T, loc: Locale): string {
  return loc === 'fr' ? field : `${field}${loc === 'en' ? 'En' : loc === 'es' ? 'Es' : 'Ar'}`;
}

// ─── Catégories ─────────────────────────────────────────────────────────────

export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; hint: string }> = {
  frontend: { label: 'Front-end', hint: "Tout ce qui s'affiche dans le navigateur." },
  backend: { label: 'Back-end', hint: 'Serveurs, API et bases de données.' },
  mobile: { label: 'Mobile', hint: 'Applications Android et iOS.' },
  tools: { label: 'Outils', hint: 'Git, Docker, éditeurs, design…' },
};
export const SKILL_ORDER: SkillCategory[] = ['frontend', 'backend', 'mobile', 'tools'];

export const PROJECT_CATEGORIES: Record<ProjectCategory, { label: string; hint: string }> = {
  web: { label: 'Site web', hint: 'Site ou application qui tourne dans un navigateur.' },
  mobile: { label: 'Mobile', hint: 'Application Android ou iOS.' },
  desktop: { label: 'Logiciel', hint: 'Programme installé sur un ordinateur.' },
};
export const PROJECT_ORDER: ProjectCategory[] = ['web', 'mobile', 'desktop'];

// ─── Réseaux sociaux (tous facultatifs) ─────────────────────────────────────

export const SOCIALS: { key: SocialKey; label: string; placeholder: string; base: string }[] = [
  { key: 'github', label: 'GitHub', placeholder: 'Rayane-62', base: 'github.com/' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'mohamed-rayane-benlalam', base: 'linkedin.com/in/' },
  { key: 'instagram', label: 'Instagram', placeholder: 'rayane.dev', base: 'instagram.com/' },
  { key: 'facebook', label: 'Facebook', placeholder: 'rayane.dev', base: 'facebook.com/' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'rayane_dev', base: 'x.com/' },
  { key: 'youtube', label: 'YouTube', placeholder: 'rayane.dev', base: 'youtube.com/@' },
  { key: 'behance', label: 'Behance', placeholder: 'rayane', base: 'behance.net/' },
  { key: 'dribbble', label: 'Dribbble', placeholder: 'rayane', base: 'dribbble.com/' },
];

/**
 * Un pseudo qui contient un espace (ou des caractères interdits) donne un lien cassé.
 * C'est le cas du LinkedIn repris de Strapi : « Rayane Benlalam » est un nom affiché, pas un pseudo.
 */
export const badHandle = (v: string | null | undefined) => !!v && /[\s@]/.test(v.trim());

/** Pseudo → lien complet, comme l'API le construit pour le site. */
export function socialUrl(key: SocialKey, handle: string): string {
  const path = handle.split('/').map(encodeURIComponent).join('/');
  const map: Record<SocialKey, string> = {
    github: `https://github.com/${path}`,
    linkedin: `https://www.linkedin.com/in/${path}`,
    instagram: `https://www.instagram.com/${path}`,
    facebook: `https://www.facebook.com/${path}`,
    x: `https://x.com/${path}`,
    youtube: /^(channel|c|user)\//i.test(handle) ? `https://www.youtube.com/${path}` : `https://www.youtube.com/@${path}`,
    behance: `https://www.behance.net/${path}`,
    dribbble: `https://dribbble.com/${path}`,
  };
  return map[key];
}

/** Lien WhatsApp à partir d'un numéro algérien (même règle que l'API). */
export function waLink(phone: string) {
  const d = phone.replace(/[\s.\-()]/g, '').replace(/^\+213/, '0').replace(/^00213/, '0').replace(/\D/g, '');
  return `https://wa.me/${d.startsWith('0') ? `213${d.slice(1)}` : d}`;
}

export const telLink = (phone: string) => `tel:${phone.replace(/[\s.\-()]/g, '')}`;
