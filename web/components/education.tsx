import { getTranslations } from "next-intl/server";
import { Scramble } from "@/components/scramble";
import { IconCap } from "@/components/icons";
import type { Education as EducationItem } from "@/lib/api";

export async function Education({
  educations,
}: {
  educations: EducationItem[];
}) {
  const t = await getTranslations("Education");
  if (educations.length === 0) return null;

  return (
    <section className="block z" id="education">
      <div className="wrap">
        <p className="eyebrow">{t("eyebrow")}</p>
        <Scramble as="h2" className="title z-in" text={t("title")} />
        <p className="lede z-in" style={{ "--i": 1 } as React.CSSProperties}>
          {t("description")}
        </p>

        <div className="rail z-in" style={{ "--i": 2 } as React.CSSProperties}>
          {educations.map((e) => (
            <article className="item" key={e.id}>
              <span className="node" aria-hidden="true">
                <IconCap />
              </span>
              <div className="card">
                <h3>{e.degree}</h3>
                <div className="org">{e.institution}</div>
                <div className="per">
                  <span>{e.period}</span>
                  {e.current && <span className="pill-now">{t("current")}</span>}
                </div>
                {e.description && <p className="desc">{e.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
