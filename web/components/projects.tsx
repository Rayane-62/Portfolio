import { getTranslations } from "next-intl/server";
import { Scramble } from "@/components/scramble";
import { IconBox, IconExternal, IconMail } from "@/components/icons";
import { ProjectThumb } from "@/components/project-thumb";
import type { Project } from "@/lib/api";

/* Les projets viennent de l'admin. Aucun projet n'est codé en dur ici :
   tant que la table est vide, la section affiche un état vide assumé. */

export async function Projects({ projects }: { projects: Project[] }) {
  const t = await getTranslations("Projects");

  return (
    <section className="block z" id="projects">
      <div className="wrap">
        <p className="eyebrow">{t("eyebrow")}</p>
        <Scramble as="h2" className="title z-in" text={t("title")} />
        <p className="lede z-in" style={{ "--i": 1 } as React.CSSProperties}>
          {t("description")}
        </p>

        {projects.length === 0 ? (
          <div
            className="card empty z-in"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <span className="ei" aria-hidden="true">
              <IconBox />
            </span>
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyText")}</p>
            <a className="btn btn-ghost" href="#contact">
              <IconMail />
              <span>{t("emptyCta")}</span>
            </a>
          </div>
        ) : (
          <div
            className="proj-grid z-in"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            {projects.map((p) => (
              <article className="card proj" key={p.id}>
                <ProjectThumb title={p.title} imageUrl={p.imageUrl} />
                <div className="body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="tags">
                      {p.technologies.map((tech) => (
                        <span className="tag" key={tech}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="links">
                    {p.liveUrl && (
                      <a
                        className="mini"
                        href={p.liveUrl}
                        target="_blank"
                        rel="noopener"
                      >
                        <IconExternal />
                        {t("ctaLive")}
                      </a>
                    )}
                    {p.githubUrl && (
                      <a
                        className="mini"
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener"
                      >
                        <IconExternal />
                        {t("ctaCode")}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
