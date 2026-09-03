"use client";

import { useState, type FormEvent } from "react";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  MailIcon,
  PhoneIcon,
  WhatsAppIcon,
  GithubIcon,
  LinkedInIcon,
} from "@/components/icons";
import {
  getWhatsAppUrl,
  getProfileUrl,
  submitContactMessage,
  type StrapiInfo,
} from "@/lib/strapi";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const FALLBACK_EMAIL = "benlalamrayane@gmail.com";
const FALLBACK_PHONE = "+213 549 107 247";
const FALLBACK_WHATSAPP_HREF = "https://wa.me/213549107247";
const GITHUB_BASE_URL = "https://github.com/";
const LINKEDIN_BASE_URL = "https://www.linkedin.com/in/";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export function Contact({ info }: { info: StrapiInfo | null }) {
  const t = useTranslations("Contact");
  const tHero = useTranslations("Hero");

  const email = info?.email ?? FALLBACK_EMAIL;
  const phone = info?.phone ?? FALLBACK_PHONE;
  const whatsappHref = getWhatsAppUrl(info?.whatsapp ?? null) ?? FALLBACK_WHATSAPP_HREF;

  const socialLinks = [
    {
      id: "github",
      href: getProfileUrl(GITHUB_BASE_URL, info?.github ?? null) ?? "#",
      icon: GithubIcon,
      label: "GitHub",
    },
    {
      id: "linkedin",
      href: getProfileUrl(LINKEDIN_BASE_URL, info?.linkedin ?? null) ?? "#",
      icon: LinkedInIcon,
      label: "LinkedIn",
    },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    const ok = await submitContactMessage({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
    setIsSubmitting(false);

    alert(ok ? t("form.successAlert") : t("form.errorAlert"));
    if (ok) form.reset();
  }

  return (
    <section id="contact" className="px-6 py-24 md:px-16">
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

        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <motion.span
              variants={item}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 backdrop-blur-md"
            >
              {tHero("badge")}
            </motion.span>

            <motion.p
              variants={item}
              className="max-w-md text-base text-[var(--text-muted)] sm:text-lg"
            >
              {t("invite")}
            </motion.p>

            <motion.a
              variants={item}
              href={`mailto:${email}`}
              data-cursor-hover
              className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-[var(--text)] backdrop-blur-[20px] transition-colors hover:bg-[var(--glass-hover-bg)]"
            >
              <MailIcon className="size-5 shrink-0 text-[var(--accent)]" />
              {email}
            </motion.a>

            <motion.a
              variants={item}
              href={`tel:${phone.replace(/\s/g, "")}`}
              data-cursor-hover
              className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-[var(--text)] backdrop-blur-[20px] transition-colors hover:bg-[var(--glass-hover-bg)]"
            >
              <PhoneIcon className="size-5 shrink-0 text-[var(--accent)]" />
              {phone}
            </motion.a>

            <motion.a
              variants={item}
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-[var(--text)] backdrop-blur-[20px] transition-colors hover:bg-[var(--glass-hover-bg)]"
            >
              <WhatsAppIcon className="size-5 shrink-0 text-[var(--accent)]" />
              WhatsApp
            </motion.a>

            <motion.div variants={item} className="flex items-center gap-3">
              {socialLinks.map(({ id, href, icon: SocialIcon, label }) => (
                <a
                  key={id}
                  href={href}
                  aria-label={label}
                  data-cursor-hover
                  className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2.5 text-sm text-[var(--text)] backdrop-blur-[20px] transition-colors hover:bg-[var(--glass-hover-bg)]"
                >
                  <SocialIcon className="size-4" />
                  {label}
                </a>
              ))}
            </motion.div>
          </div>

          <motion.form
            variants={item}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-[20px]"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-name"
                className="text-sm text-[var(--text-muted)]"
              >
                {t("form.name")}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                placeholder={t("form.namePlaceholder")}
                className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-hover-bg)] px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-email"
                className="text-sm text-[var(--text-muted)]"
              >
                {t("form.email")}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder={t("form.emailPlaceholder")}
                className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-hover-bg)] px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-subject"
                className="text-sm text-[var(--text-muted)]"
              >
                {t("form.subject")}
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                placeholder={t("form.subjectPlaceholder")}
                className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-hover-bg)] px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-message"
                className="text-sm text-[var(--text-muted)]"
              >
                {t("form.message")}
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                placeholder={t("form.messagePlaceholder")}
                className="resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--glass-hover-bg)] px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              data-cursor-hover
              className="mt-2 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--bg)] transition-all hover:opacity-90 hover:shadow-[0_0_30px_-5px_var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("form.sending") : t("form.send")}
            </button>
          </motion.form>
        </div>
      </motion.div>
    </section>
  );
}
