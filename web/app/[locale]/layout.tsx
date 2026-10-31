import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import "../globals.css";
import { Scene } from "@/components/scene";
import { SiteNav } from "@/components/site-nav";
import { Reveal } from "@/components/reveal";
import { routing } from "@/i18n/routing";
import { getPortfolio, type Locale } from "@/lib/api";
import { BRAND_INITIALS, LOCALE_TAGS, OG_LOCALES, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const { info } = await getPortfolio(locale as Locale);
  const title = `${info.name} — ${info.title}`;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const description = info.bio || t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    authors: [{ name: info.nameLatin }],
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
        "x-default": `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "profile",
      url: `/${locale}`,
      siteName: info.nameLatin,
      title,
      description,
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALES[l]),
    },
    twitter: { card: "summary", title, description },
  };
}

/* Le thème est posé avant le premier rendu : pas de clignotement. */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = locale === "ar" ? "rtl" : "ltr";
  const { info } = await getPortfolio(locale as Locale);
  const year = new Date().getFullYear();

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <Scene localeTag={LOCALE_TAGS[locale]} />
          <SkipLink locale={locale} />
          <SiteNav initials={BRAND_INITIALS} />
          <div className="page">
            <main id="main">{children}</main>
            <footer>
              <span className="sig">
                © {year} {info.nameLatin}
              </span>
              <Signature locale={locale} />
            </footer>
          </div>
          <Reveal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

async function SkipLink({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Ui" });
  return (
    <a className="skip" href="#main">
      {t("skip")}
    </a>
  );
}

async function Signature({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Ui" });
  return <span>{t("footer")}</span>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
