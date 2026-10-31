import { getTranslations } from "next-intl/server";
import { ScrambleLines } from "@/components/scramble";
import { IconDownload, IconList, IconMail } from "@/components/icons";
import type { Info } from "@/lib/api";

/**
 * Deux lignes : le nom de famille, puis les prénoms en dégradé.
 * Le nom arabe compte quatre mots (بن لعلام محمد ريان) : on coupe au milieu.
 */
function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return [name, ""];
  const cut = parts.length >= 4 ? Math.floor(parts.length / 2) : 1;
  return [parts.slice(0, cut).join(" "), parts.slice(cut).join(" ")];
}

export async function Hero({ info }: { info: Info }) {
  const t = await getTranslations("Hero");
  const [line1, line2] = splitName(info.name);

  return (
    <section className="hero" id="hero">
      <div className="wrap hero-inner">
        <span className="badge">
          <span
            className={`dot${info.available ? " live" : ""}`}
            aria-hidden="true"
          />
          <span>{info.available ? t("available") : t("unavailable")}</span>
        </span>

        <ScrambleLines
          as="h1"
          lines={[line1, line2]}
          lineClassNames={["l1", "l2"]}
        />

        <p className="role">{info.title}</p>
        {info.bio && <p className="bio">{info.bio}</p>}

        <div className="cta-row">
          <a className="btn btn-primary" href="#projects">
            <IconList />
            <span>{t("ctaProjects")}</span>
          </a>
          <a className="btn btn-ghost" href="#contact">
            <IconMail />
            <span>{t("ctaContact")}</span>
          </a>
          {/* l'API renvoie `cvUrl: null` tant qu'aucun CV n'est envoyé */}
          {info.cvUrl && (
            <a
              className="btn btn-ghost"
              href={info.cvUrl}
              target="_blank"
              rel="noopener"
              download
            >
              <IconDownload />
              <span>{t("ctaCv")}</span>
            </a>
          )}
        </div>

        <div className="stats">
          <div className="stat">
            <div className="n">{info.stats.projects}</div>
            <div className="k">{t("statProjects")}</div>
          </div>
          <div className="stat">
            <div className="n">{info.stats.experience}</div>
            <div className="k">{t("statYears")}</div>
          </div>
          <div className="stat">
            <div className="n">{info.stats.clients}</div>
            <div className="k">{t("statClients")}</div>
          </div>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <i />
        <span>{t("scroll")}</span>
      </div>
    </section>
  );
}
