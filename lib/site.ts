export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const OWNER_NAME = "Benlalam Mohamed Rayane";

export const GITHUB_URL = "https://github.com/Rayane-62";
// TODO: replace with the profile URL (linkedin.com/in/<slug>) once known.
export const LINKEDIN_URL =
  "https://www.linkedin.com/search/results/people/?keywords=Rayane%20Benlalam";

export const CV_PATH = "/cv.pdf";

export const OG_LOCALES = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  ar: "ar_DZ",
} as const;
