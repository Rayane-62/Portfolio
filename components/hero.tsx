"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Typewriter } from "@/components/typewriter";
import { UserIcon } from "@/components/icons";
import { getStrapiMediaUrl, type StrapiInfo } from "@/lib/strapi";

const FALLBACK_NAME = "Benlalam Mohamed Rayane";

const ROLES = [
  "Développeur Full Stack",
  "Web & Mobile Developer",
  "Ingénieur Logiciel",
  "مطور برمجيات",
];

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export function Hero({ info }: { info: StrapiInfo | null }) {
  const t = useTranslations("Hero");
  const name = info?.name ?? FALLBACK_NAME;
  const photoUrl = getStrapiMediaUrl(info?.photo ?? null);

  return (
    <section
      id="hero"
      className="flex min-h-screen items-center px-6 md:px-16"
    >
      <div className="grid w-full items-center gap-16 md:grid-cols-[1.15fr_1fr]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start gap-6"
        >
          <motion.p
            variants={item}
            className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-1.5 text-sm text-[var(--accent)] shadow-[0_0_20px_var(--glass-glow)] backdrop-blur-md"
          >
            {t("badge")}
          </motion.p>

          <motion.h1 variants={item} className="leading-tight">
            <span className="block text-xl font-medium text-[var(--text-muted)] sm:text-2xl">
              {t("greeting")}
            </span>
            <span className="block bg-gradient-to-r from-[var(--text)] to-[var(--accent)] bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl lg:text-5xl">
              {name}
            </span>
          </motion.h1>

          <motion.h2
            variants={item}
            className="text-2xl font-semibold text-[var(--text-muted)] sm:text-3xl"
          >
            <Typewriter words={ROLES} />
          </motion.h2>

          <motion.p
            variants={item}
            className="max-w-xl text-base text-[var(--text-muted)] sm:text-lg"
          >
            {t("description")}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-4 pt-2">
            <a
              href="#projects"
              data-cursor-hover
              className="rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--bg)] transition-all hover:opacity-90 hover:backdrop-blur-md"
            >
              {t("ctaProjects")}
            </a>
            <a
              href="#contact"
              data-cursor-hover
              className="rounded-lg border border-[var(--glass-border)] bg-transparent px-6 py-3 font-medium text-[var(--text)] backdrop-blur-md transition-all hover:bg-[var(--glass-hover-bg)]"
            >
              {t("ctaContact")}
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: EASE_OUT }}
          className="relative mx-auto flex size-56 items-center justify-center sm:size-72 md:size-80"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--accent)" }}
            animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex size-full items-center justify-center overflow-hidden rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_0_60px_-10px_var(--accent)] backdrop-blur-xl">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="size-full object-cover"
              />
            ) : (
              <UserIcon className="size-20 text-[var(--text-muted)] sm:size-24" />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
