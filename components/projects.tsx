"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { FolderIcon, GithubIcon } from "@/components/icons";
import { getStrapiMediaUrl, type StrapiProject } from "@/lib/strapi";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

type Category = "web" | "mobile" | "desktop";

type ProjectItem = {
  key: string;
  title: string;
  description: string;
  categories: Category[];
  techs: string[];
  imageUrl: string | null;
  gradient: string;
  liveHref: string;
  githubHref: string;
};

const GRADIENTS = [
  "from-cyan-500/40 via-blue-500/30 to-purple-500/30",
  "from-amber-500/40 via-orange-500/30 to-pink-500/30",
  "from-emerald-500/40 via-teal-500/30 to-cyan-500/30",
  "from-purple-500/40 via-fuchsia-500/30 to-pink-500/30",
];

const FALLBACK_PROJECTS_SOURCE: {
  id: string;
  categories: Category[];
  techs: string[];
}[] = [
  {
    id: "quickDelivery",
    categories: ["web", "mobile"],
    techs: ["React", "Next.js", "NestJS", "Kotlin"],
  },
  {
    id: "mcaStadium",
    categories: ["web"],
    techs: ["Angular", "NestJS"],
  },
  {
    id: "autoCare",
    categories: ["mobile"],
    techs: ["Kotlin", "Jetpack Compose"],
  },
  {
    id: "ecommerce",
    categories: ["web"],
    techs: ["React", "Next.js", "MySQL"],
  },
];

export function Projects({
  projects,
}: {
  projects: StrapiProject[] | null;
}) {
  const t = useTranslations("Projects");

  const items: ProjectItem[] = projects
    ? projects.map((p, index) => ({
        key: String(p.id),
        title: p.title,
        description: p.description,
        categories: [p.category],
        techs: p.technologies ?? [],
        imageUrl: getStrapiMediaUrl(p.image),
        gradient: GRADIENTS[index % GRADIENTS.length],
        liveHref: p.liveUrl || "#",
        githubHref: p.githubUrl || "#",
      }))
    : FALLBACK_PROJECTS_SOURCE.map((p, index) => ({
        key: p.id,
        title: t(`items.${p.id}.title`),
        description: t(`items.${p.id}.description`),
        categories: p.categories,
        techs: p.techs,
        imageUrl: null,
        gradient: GRADIENTS[index % GRADIENTS.length],
        liveHref: "#",
        githubHref: "#",
      }));

  return (
    <section id="projects" className="px-6 py-24 md:px-16">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={container}
        className="mx-auto max-w-6xl"
      >
        <motion.div variants={item} className="mb-14">
          <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
            {t("title")}
          </h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-[var(--accent)]" />
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {items.map(
            ({
              key,
              title,
              description,
              categories,
              techs,
              imageUrl,
              gradient,
              liveHref,
              githubHref,
            }) => (
              <motion.div
                key={key}
                variants={item}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-[20px] transition-shadow duration-300 hover:border-[var(--accent)]/40 hover:shadow-[0_20px_45px_-15px_var(--accent)]"
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-44 items-center justify-center bg-gradient-to-br ${gradient}`}
                  >
                    <FolderIcon className="size-14 text-white/50" />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-[var(--glass-hover-bg)] px-2.5 py-0.5 text-xs text-[var(--accent)]"
                      >
                        {t(`categories.${category}`)}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-xl font-bold text-[var(--text)]">
                    {title}
                  </h3>

                  <p className="text-sm text-[var(--text-muted)]">
                    {description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {techs.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-[var(--glass-border)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-2">
                    <a
                      href={liveHref}
                      data-cursor-hover
                      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
                    >
                      {t("ctaLive")}
                    </a>
                    <a
                      href={githubHref}
                      data-cursor-hover
                      className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] px-4 py-2 text-sm font-medium text-[var(--text)] backdrop-blur-md transition-colors hover:bg-[var(--glass-hover-bg)]"
                    >
                      <GithubIcon className="size-4" />
                      {t("ctaGithub")}
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          )}
        </div>
      </motion.div>
    </section>
  );
}
