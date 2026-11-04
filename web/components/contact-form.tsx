"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sendContact } from "@/lib/api";
import { IconCheck, IconSend, IconWarn } from "@/components/icons";

/* Formulaire de prise de contact : nom, téléphone (facultatif),
   e-mail et description du besoin. Validation côté client, puis
   envoi direct à l'API — la limite de 10 messages / 10 min se
   compte par IP, elle doit voir celle du visiteur. */

type FieldName = "name" | "phone" | "email" | "message";
type Errors = Partial<Record<FieldName, string>>;
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MIN_MESSAGE = 10;

export function ContactForm() {
  const t = useTranslations("Contact.form");

  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (field: FieldName, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function validate(): Errors {
    const next: Errors = {};
    if (!values.name.trim()) next.name = t("errors.nameRequired");
    else if (values.name.trim().length > 120) next.name = t("errors.nameLong");

    if (!values.email.trim()) next.email = t("errors.emailRequired");
    else if (!EMAIL_RE.test(values.email.trim()))
      next.email = t("errors.emailInvalid");

    const phone = values.phone.trim();
    if (phone && phone.length > 30) next.phone = t("errors.phoneLong");
    else if (phone && !/^[\d+\s().-]{6,}$/.test(phone))
      next.phone = t("errors.phoneInvalid");

    const message = values.message.trim();
    if (!message) next.message = t("errors.messageRequired");
    else if (message.length < MIN_MESSAGE)
      next.message = t("errors.messageShort", { min: MIN_MESSAGE });
    else if (message.length > 5000) next.message = t("errors.messageLong");

    return next;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "sending" });
    const phone = values.phone.trim();
    const result = await sendContact({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: phone || null,
      // l'API exige un objet : on le compose pour que l'admin lise
      // tout de suite de qui vient la demande
      subject: `Demande via le portfolio — ${values.name.trim()}`.slice(0, 200),
      message: values.message.trim(),
    });

    if (result.ok) {
      setStatus({ kind: "sent" });
      setValues({ name: "", phone: "", email: "", message: "" });
      return;
    }

    if (result.reason === "rate-limit") {
      setStatus({ kind: "error", message: t("errors.rateLimit") });
    } else if (result.reason === "invalid") {
      setStatus({ kind: "error", message: result.detail || t("errors.invalid") });
    } else {
      setStatus({ kind: "error", message: t("errors.network") });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="form">
        <div className="alert ok" role="status">
          <IconCheck />
          <div>
            <strong>{t("successTitle")}</strong>
            <p>{t("successText")}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStatus({ kind: "idle" })}
        >
          <span>{t("again")}</span>
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <Field
          name="name"
          label={t("name")}
          error={errors.name}
          value={values.name}
          onChange={set}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          required
        />
        <Field
          name="phone"
          label={t("phone")}
          optionalLabel={t("optional")}
          error={errors.phone}
          value={values.phone}
          onChange={set}
          placeholder={t("phonePlaceholder")}
          type="tel"
          autoComplete="tel"
          dir="ltr"
        />
      </div>

      <Field
        name="email"
        label={t("email")}
        error={errors.email}
        value={values.email}
        onChange={set}
        placeholder={t("emailPlaceholder")}
        type="email"
        autoComplete="email"
        dir="ltr"
        required
      />

      <div className="field" data-invalid={errors.message ? "true" : undefined}>
        <label htmlFor="cf-message">{t("message")}</label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          value={values.message}
          placeholder={t("messagePlaceholder")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
          onChange={(e) => set("message", e.target.value)}
          required
        />
        {errors.message && (
          <span className="err" id="cf-message-err" role="alert">
            <IconWarn />
            {errors.message}
          </span>
        )}
      </div>

      {status.kind === "error" && (
        <div className="alert bad" role="alert">
          <IconWarn />
          <div>
            <strong>{t("errorTitle")}</strong>
            <p>{status.message}</p>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? (
          <>
            <span className="spin" aria-hidden="true" />
            <span>{t("sending")}</span>
          </>
        ) : (
          <>
            <IconSend />
            <span>{t("send")}</span>
          </>
        )}
      </button>
      <p className="note">{t("note")}</p>
    </form>
  );
}

function Field({
  name,
  label,
  optionalLabel,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  dir,
  required,
}: {
  name: FieldName;
  label: string;
  optionalLabel?: string;
  error?: string;
  value: string;
  onChange: (field: FieldName, value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  dir?: "ltr";
  required?: boolean;
}) {
  const id = `cf-${name}`;
  return (
    <div className="field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>
        {label}
        {optionalLabel && <span className="opt">{optionalLabel}</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        dir={dir}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
      />
      {error && (
        <span className="err" id={`${id}-err`} role="alert">
          <IconWarn />
          {error}
        </span>
      )}
    </div>
  );
}
