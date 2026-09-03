import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import "../globals.css";
import { AppShell } from "@/components/app-shell";
import { AnimatedBackground } from "@/components/animated-background";
import { CustomCursor } from "@/components/custom-cursor";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal portfolio",
};

const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <NextIntlClientProvider>
          <AnimatedBackground />
          <AppShell>{children}</AppShell>
          <CustomCursor />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
