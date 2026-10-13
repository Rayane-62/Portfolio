const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

export type Locale = "fr" | "en" | "es" | "ar";

type StrapiMedia = {
  url: string;
} | null;

function resolveLocale(
  base: string,
  en: string | null | undefined,
  es: string | null | undefined,
  ar: string | null | undefined,
  locale: Locale
): string {
  if (locale === "en" && en) return en;
  if (locale === "es" && es) return es;
  if (locale === "ar" && ar) return ar;
  return base;
}

export type StrapiProject = {
  id: number;
  documentId: string;
  title: string;
  description: string;
  category: "web" | "mobile" | "desktop";
  technologies: string[] | null;
  image: StrapiMedia;
  liveUrl: string | null;
  githubUrl: string | null;
  order: number | null;
};

export type StrapiSkill = {
  id: number;
  documentId: string;
  name: string;
  iconUrl: string;
  category: "frontend" | "backend" | "mobile" | "tools";
};

export type StrapiExperience = {
  id: number;
  documentId: string;
  position: string;
  company: string;
  period: string;
  description: string;
  technologies: string[] | null;
};

type RawStrapiExperience = StrapiExperience & {
  positionEn: string | null;
  positionEs: string | null;
  positionAr: string | null;
  companyEn: string | null;
  companyEs: string | null;
  companyAr: string | null;
  periodEn: string | null;
  periodEs: string | null;
  periodAr: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  descriptionAr: string | null;
};

export type StrapiEducation = {
  id: number;
  documentId: string;
  degree: string;
  institution: string;
  period: string;
  description: string | null;
  current: boolean;
  order: number | null;
};

type RawStrapiEducation = StrapiEducation & {
  degreeEn: string | null;
  degreeEs: string | null;
  degreeAr: string | null;
  institutionEn: string | null;
  institutionEs: string | null;
  institutionAr: string | null;
  periodEn: string | null;
  periodEs: string | null;
  periodAr: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  descriptionAr: string | null;
};

export type StrapiInfo = {
  id: number;
  documentId: string;
  name: string;
  title: string;
  bio: string;
  photo: StrapiMedia;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  github: string | null;
  linkedin: string | null;
  available: boolean;
  statsProjects: number | null;
  statsExperience: number | null;
  statsClients: number | null;
};

type RawStrapiInfo = StrapiInfo & {
  nameAr: string | null;
  titleEn: string | null;
  titleEs: string | null;
  titleAr: string | null;
  bioEn: string | null;
  bioEs: string | null;
  bioAr: string | null;
};

async function fetchFromStrapi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/api${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data as T) ?? null;
  } catch {
    return null;
  }
}

export function getStrapiMediaUrl(media: StrapiMedia): string | null {
  if (!media?.url) return null;
  return media.url.startsWith("http") ? media.url : `${STRAPI_URL}${media.url}`;
}

export function getWhatsAppUrl(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function getProfileUrl(baseUrl: string, value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("http") ? value : `${baseUrl}${value}`;
}

export async function getProjects(): Promise<StrapiProject[] | null> {
  const data = await fetchFromStrapi<StrapiProject[]>(
    "/projects?populate=*&sort=order:asc&pagination[pageSize]=100"
  );
  return data && data.length > 0 ? data : null;
}

export async function getSkills(): Promise<StrapiSkill[] | null> {
  const data = await fetchFromStrapi<StrapiSkill[]>(
    "/skills?pagination[pageSize]=100"
  );
  return data && data.length > 0 ? data : null;
}

export async function getExperiences(
  locale: Locale = "fr"
): Promise<StrapiExperience[] | null> {
  const data = await fetchFromStrapi<RawStrapiExperience[]>(
    "/experiences?pagination[pageSize]=100"
  );
  if (!data || data.length === 0) return null;
  return data.map((e) => ({
    ...e,
    position: resolveLocale(e.position, e.positionEn, e.positionEs, e.positionAr, locale),
    company: resolveLocale(e.company, e.companyEn, e.companyEs, e.companyAr, locale),
    period: resolveLocale(e.period, e.periodEn, e.periodEs, e.periodAr, locale),
    description: resolveLocale(
      e.description,
      e.descriptionEn,
      e.descriptionEs,
      e.descriptionAr,
      locale
    ),
  }));
}

export async function getEducations(
  locale: Locale = "fr"
): Promise<StrapiEducation[] | null> {
  const data = await fetchFromStrapi<RawStrapiEducation[]>(
    "/educations?sort=order:asc&pagination[pageSize]=100"
  );
  if (!data || data.length === 0) return null;
  return data.map((e) => ({
    ...e,
    degree: resolveLocale(e.degree, e.degreeEn, e.degreeEs, e.degreeAr, locale),
    institution: resolveLocale(
      e.institution,
      e.institutionEn,
      e.institutionEs,
      e.institutionAr,
      locale
    ),
    period: resolveLocale(e.period, e.periodEn, e.periodEs, e.periodAr, locale),
    description: e.description
      ? resolveLocale(
          e.description,
          e.descriptionEn,
          e.descriptionEs,
          e.descriptionAr,
          locale
        )
      : null,
  }));
}

export async function getInfo(locale: Locale = "fr"): Promise<StrapiInfo | null> {
  const raw = await fetchFromStrapi<RawStrapiInfo>("/info?populate=*");
  if (!raw) return null;
  return {
    ...raw,
    name: locale === "ar" && raw.nameAr ? raw.nameAr : raw.name,
    title: resolveLocale(raw.title, raw.titleEn, raw.titleEs, raw.titleAr, locale),
    bio: resolveLocale(raw.bio, raw.bioEn, raw.bioEs, raw.bioAr, locale),
  };
}

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function submitContactMessage(
  input: ContactMessageInput
): Promise<boolean> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: input }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
