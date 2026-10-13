export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const OWNER_NAME = "Benlalam Mohamed Rayane";

export const GITHUB_URL = "https://github.com/Rayane-62";
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/rayane-benlalam-9b606327a/";

export const CV_PATH = "/cv.pdf";

export const OG_LOCALES = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  ar: "ar_DZ",
} as const;
