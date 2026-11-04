import { LOCALES, type Locale } from '../db/schema';

export { LOCALES, type Locale };

/** « en » → « En ». Sert à retrouver la colonne de traduction. */
const SUFFIX: Record<Exclude<Locale, 'fr'>, string> = { en: 'En', es: 'Es', ar: 'Ar' };

/** ?locale=xx inconnu ou absent → français. */
export function parseLocale(value: unknown): Locale {
  const v = typeof value === 'string' ? value.trim().toLowerCase().slice(0, 2) : '';
  return (LOCALES as readonly string[]).includes(v) ? (v as Locale) : 'fr';
}

/**
 * Lit un champ traduit : « title » + « titleEn » / « titleEs » / « titleAr ».
 * Traduction absente ou vide → on retombe sur le français, le site n'a jamais de trou.
 * Renvoie NULL seulement si le français lui-même est vide (ex. description facultative).
 */
export function tr(row: Record<string, unknown>, field: string, locale: Locale): string | null {
  if (locale !== 'fr') {
    const translated = row[`${field}${SUFFIX[locale]}`];
    if (typeof translated === 'string' && translated.trim()) return translated;
  }
  const base = row[field];
  return typeof base === 'string' && base.trim() ? base : null;
}
