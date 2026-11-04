import { getTranslations } from "next-intl/server";
import { Scramble } from "@/components/scramble";
import { ContactForm } from "@/components/contact-form";
import { SocialLinks } from "@/components/social-links";
import {
  IconChevron,
  IconClock,
  IconMail,
  IconPhone,
  IconWhatsapp,
} from "@/components/icons";
import type { Info } from "@/lib/api";

/** +213549107247 → +213 549 107 247 (toujours lu de gauche à droite) */
function prettyPhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  const plus = digits.startsWith("+");
  const body = plus ? digits.slice(1) : digits;
  if (body.length < 9) return raw;
  const parts = [body.slice(0, 3), body.slice(3, 6), body.slice(6, 9), body.slice(9)];
  return (plus ? "+" : "") + parts.filter(Boolean).join(" ");
}

export async function Contact({ info }: { info: Info }) {
  const t = await getTranslations("Contact");

  return (
    <section className="block z" id="contact">
      <div className="wrap">
        <p className="eyebrow">{t("eyebrow")}</p>
        <Scramble as="h2" className="title z-in" text={t("title")} />
        <p className="lede z-in" style={{ "--i": 1 } as React.CSSProperties}>
          {t("description")}
        </p>

        <div className="contact-grid">
          <div
            className="card ccard z-in"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <h3 className="sub-h">{t("directTitle")}</h3>
            <ul className="clist">
              <li>
                <a className="crow" href={`mailto:${info.email}`}>
                  <span className="ci" aria-hidden="true">
                    <IconMail />
                  </span>
                  <div>
                    <div className="ck">{t("email")}</div>
                    <div className="cv" dir="ltr">
                      {info.email}
                    </div>
                  </div>
                  <span className="cgo" aria-hidden="true">
                    <IconChevron />
                  </span>
                </a>
              </li>
              {info.phone && (
                <li>
                  <a className="crow" href={`tel:${info.phone}`}>
                    <span className="ci" aria-hidden="true">
                      <IconPhone />
                    </span>
                    <div>
                      <div className="ck">{t("phone")}</div>
                      <div className="cv" dir="ltr">
                        {prettyPhone(info.phone)}
                      </div>
                    </div>
                    <span className="cgo" aria-hidden="true">
                      <IconChevron />
                    </span>
                  </a>
                </li>
              )}
              {info.whatsappLink && (
                <li>
                  <a
                    className="crow"
                    href={info.whatsappLink}
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="ci" aria-hidden="true">
                      <IconWhatsapp />
                    </span>
                    <div>
                      <div className="ck">{t("whatsapp")}</div>
                      <div className="cv" dir="ltr">
                        {prettyPhone(info.whatsapp ?? "")}
                      </div>
                    </div>
                    <span className="cgo" aria-hidden="true">
                      <IconChevron />
                    </span>
                  </a>
                </li>
              )}
            </ul>

            <SocialLinks socials={info.socials} />

            <div className="facts" style={{ marginTop: 22 }}>
              <div className="fact" style={{ padding: "16px 0 0" }}>
                <span className="fi" aria-hidden="true">
                  <IconClock />
                </span>
                <div>
                  <div className="fk">{t("responseTime")}</div>
                  <div className="fv">{t("responseTimeValue")}</div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card ccard z-in"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <h3 className="sub-h">{t("formTitle")}</h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
