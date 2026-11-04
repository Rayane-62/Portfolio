import { getTranslations } from "next-intl/server";
import { Scramble } from "@/components/scramble";
import { IconCase } from "@/components/icons";
import type { Experience as ExperienceItem } from "@/lib/api";

export async function Experience({
  experiences,
}: {
  experiences: ExperienceItem[];
}) {
  const t = await getTranslations("Experience");
  if (experiences.length === 0) return null;

  return (
    <section className="block z" id="experience">
      <div className="wrap">
        <p className="eyebrow">{t("eyebrow")}</p>
        <Scramble as="h2" className="title z-in" text={t("title")} />
        <p className="lede z-in" style={{ "--i": 1 } as React.CSSProperties}>
          {t("description")}
        </p>

        <div className="rail z-in" style={{ "--i": 2 } as React.CSSProperties}>
          {experiences.map((e) => (
            <article className="item" key={e.id}>
              <span className="node" aria-hidden="true">
                <IconCase />
              </span>
              <div className="card">
                <h3>{e.position}</h3>
                <div className="org">{e.company}</div>
                <div className="per">
                  <span>{e.period}</span>
                  {e.current && <span className="pill-now">{t("current")}</span>}
                </div>
                {e.description && <p className="desc">{e.description}</p>}
                {e.technologies && e.technologies.length > 0 && (
                  <div className="tags">
                    {e.technologies.map((tech) => (
                      <span className="tag" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
