import { getTranslations } from "next-intl/server";
import { Scramble } from "@/components/scramble";
import { IconCap, IconCase, IconPin } from "@/components/icons";
import type { Info } from "@/lib/api";

export async function About({ info }: { info: Info }) {
  const t = await getTranslations("About");

  const facts = [
    { Icon: IconPin, k: t("factLocation"), v: t("factLocationValue") },
    { Icon: IconCap, k: t("factEducation"), v: t("factEducationValue") },
    { Icon: IconCase, k: t("factMode"), v: t("factModeValue") },
  ];

  return (
    <section className="block z" id="about">
      <div className="wrap">
        <p className="eyebrow">{t("eyebrow")}</p>
        <Scramble as="h2" className="title z-in" text={t("title")} />
        <div className="about-grid">
          <div className="about-text z-in" style={{ "--i": 1 } as React.CSSProperties}>
            {info.photoUrl && (
              // l'API sert une URL absolue ; une balise simple évite
              // d'avoir à déclarer un hôte distant pour l'optimiseur d'images
              // eslint-disable-next-line @next/next/no-img-element
              <img className="portrait" src={info.photoUrl} alt={info.name} />
            )}
            {info.bio && <p>{info.bio}</p>}
            <p>{t("extra")}</p>
          </div>
          <div className="facts">
            {facts.map(({ Icon, k, v }, i) => (
              <div
                className="card fact z-in"
                key={k}
                style={{ "--i": i + 2 } as React.CSSProperties}
              >
                <span className="fi" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <div className="fk">{k}</div>
                  <div className="fv">{v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
