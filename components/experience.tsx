"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { StrapiExperience } from "@/lib/strapi";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
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

type ExperienceItem = {
  key: string;
  role: string;
  company: string;
  period: string;
  description: string;
  techs?: string[];
};

const FALLBACK_EXPERIENCES_SOURCE: { id: string; techs?: string[] }[] = [
  { id: "internship", techs: ["HTML", "SCSS", "TypeScript", "Angular"] },
  { id: "freelance" },
];

export function Experience({
  experiences,
}: {
  experiences: StrapiExperience[] | null;
}) {
  const t = useTranslations("Experience");

  const items: ExperienceItem[] = experiences
    ? experiences.map((e) => ({
        key: String(e.id),
        role: e.position,
        company: e.company,
        period: e.period,
        description: e.description,
        techs: e.technologies ?? undefined,
      }))
    : FALLBACK_EXPERIENCES_SOURCE.map((e) => ({
        key: e.id,
        role: t(`items.${e.id}.role`),
        company: t(`items.${e.id}.company`),
        period: t(`items.${e.id}.period`),
        description: t(`items.${e.id}.description`),
        techs: e.techs,
      }));

  return (
    <section id="experience" className="px-6 py-24 md:px-16">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={container}
        className="mx-auto max-w-4xl"
      >
        <motion.div variants={item} className="mb-16">
          <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
            {t("title")}
          </h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-[var(--accent)]" />
        </motion.div>

        <div className="relative flex flex-col gap-14">
          <div className="absolute top-0 bottom-0 left-4 w-px bg-[var(--glass-border)] md:left-1/2 md:-translate-x-1/2" />

          {items.map(({ key, role, company, period, description, techs }, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={key}
                variants={item}
                className="relative pl-12 md:pl-0"
              >
                <span className="absolute top-2 left-4 z-10 flex -translate-x-1/2 items-center justify-center md:left-1/2">
                  <span className="absolute size-3 animate-ping rounded-full bg-[var(--accent)] opacity-75" />
                  <span className="relative size-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                </span>

                <div
                  className={
                    isEven
                      ? "md:mr-auto md:w-[calc(50%-2.5rem)]"
                      : "md:ml-auto md:w-[calc(50%-2.5rem)]"
                  }
                >
                  <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-[20px]">
                    <span className="inline-block rounded-full bg-[var(--glass-hover-bg)] px-2.5 py-0.5 text-xs text-[var(--accent)]">
                      {period}
                    </span>

                    <h3 className="mt-3 text-lg font-bold text-[var(--text)]">
                      {role}
                    </h3>
                    <p className="text-sm text-[var(--accent)]">{company}</p>

                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                      {description}
                    </p>

                    {techs && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {techs.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full border border-[var(--glass-border)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
