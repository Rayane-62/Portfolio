import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "ar", "es"],
  defaultLocale: "fr",
});
