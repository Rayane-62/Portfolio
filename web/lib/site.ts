export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300"
).replace(/\/$/, "");

/** Monogramme de la marque dans la barre de navigation. */
export const BRAND_INITIALS = "BR";

export const OG_LOCALES = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  ar: "ar_DZ",
} as const;

/** Pour `toLocaleString` (chiffres du HUD de la scène). */
export const LOCALE_TAGS = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  ar: "ar-DZ",
} as const;
