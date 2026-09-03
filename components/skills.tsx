"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { StrapiSkill } from "@/lib/strapi";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

type Category = "frontend" | "backend" | "mobile" | "tools";

type SkillItem = {
  key: string;
  name: string;
  iconUrl: string;
  category: Category;
};

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const FALLBACK_SKILLS_SOURCE: { name: string; slug: string; category: Category }[] =
  [
    { name: "React", slug: "react", category: "frontend" },
    { name: "Next.js", slug: "nextjs", category: "frontend" },
    { name: "Angular", slug: "angularjs", category: "frontend" },
    { name: "TypeScript", slug: "typescript", category: "frontend" },
    { name: "Tailwind CSS", slug: "tailwindcss", category: "frontend" },
    { name: "NestJS", slug: "nestjs", category: "backend" },
    { name: "Node.js", slug: "nodejs", category: "backend" },
    { name: "PHP", slug: "php", category: "backend" },
    { name: "MySQL", slug: "mysql", category: "backend" },
    { name: "Kotlin", slug: "kotlin", category: "mobile" },
    { name: "Jetpack Compose", slug: "jetpackcompose", category: "mobile" },
    { name: "Git", slug: "git", category: "tools" },
    { name: "GitHub", slug: "github", category: "tools" },
    { name: "VS Code", slug: "vscode", category: "tools" },
  ];

const FALLBACK_SKILLS: SkillItem[] = FALLBACK_SKILLS_SOURCE.map((s) => ({
  key: s.slug,
  name: s.name,
  iconUrl: `${DEVICON_BASE}/${s.slug}/${s.slug}-original.svg`,
  category: s.category,
}));

export function Skills({ skills }: { skills: StrapiSkill[] | null }) {
  const t = useTranslations("Skills");

  const items: SkillItem[] = skills
    ? skills.map((s) => ({
        key: String(s.id),
        name: s.name,
        iconUrl: s.iconUrl,
        category: s.category,
      }))
    : FALLBACK_SKILLS;

  return (
    <section id="skills" className="px-6 py-24 md:px-16">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
        className="mx-auto max-w-6xl"
      >
        <motion.div variants={item} className="mb-14">
          <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
            {t("title")}
          </h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-[var(--accent)]" />
        </motion.div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(({ key, name, iconUrl, category }) => (
            <motion.div
              key={key}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-[20px] transition-shadow duration-300 hover:border-[var(--accent)]/40 hover:shadow-[0_20px_45px_-15px_var(--accent)]"
            >
              <div className="flex size-14 items-center justify-center rounded-xl bg-white/90 p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconUrl}
                  alt={name}
                  className="size-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="font-medium text-[var(--text)]">{name}</span>
              <span className="rounded-full bg-[var(--glass-hover-bg)] px-2.5 py-0.5 text-xs text-[var(--accent)]">
                {t(`categories.${category}`)}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
