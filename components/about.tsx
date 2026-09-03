"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { StrapiInfo } from "@/lib/strapi";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

const FALLBACK_STATS = {
  projects: 4,
  experience: 2,
  clients: 3,
} as const;

export function About({ info }: { info: StrapiInfo | null }) {
  const t = useTranslations("About");
  const description = info?.bio ?? t("description");

  const stats = [
    {
      key: "projects",
      value: info?.statsProjects ?? FALLBACK_STATS.projects,
    },
    {
      key: "experience",
      value: info?.statsExperience ?? FALLBACK_STATS.experience,
    },
    { key: "clients", value: info?.statsClients ?? FALLBACK_STATS.clients },
  ];

  return (
    <section id="about" className="px-6 py-24 md:px-16">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
        className="mx-auto max-w-6xl"
      >
        <motion.div variants={item} className="mb-14">
          <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
            {t("title")}
          </h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-[var(--accent)]" />
        </motion.div>

        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:items-center">
          <motion.div variants={container} className="flex flex-col gap-4">
            {stats.map(({ key, value }) => (
              <motion.div
                key={key}
                variants={item}
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-[20px]"
              >
                <div className="bg-gradient-to-r from-[var(--text)] to-[var(--accent)] bg-clip-text text-4xl font-extrabold text-transparent [text-shadow:0_0_24px_var(--glass-glow)]">
                  {value}+
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">
                  {t(`stats.${key}`)}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            variants={item}
            className="text-base leading-relaxed text-[var(--text-muted)] sm:text-lg"
          >
            {description}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
