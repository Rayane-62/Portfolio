const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

type StrapiMedia = {
  url: string;
} | null;

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
    "/projects?populate=*&sort=order:asc"
  );
  return data && data.length > 0 ? data : null;
}

export async function getSkills(): Promise<StrapiSkill[] | null> {
  const data = await fetchFromStrapi<StrapiSkill[]>("/skills");
  return data && data.length > 0 ? data : null;
}

export async function getExperiences(): Promise<StrapiExperience[] | null> {
  const data = await fetchFromStrapi<StrapiExperience[]>("/experiences");
  return data && data.length > 0 ? data : null;
}

export async function getInfo(): Promise<StrapiInfo | null> {
  return fetchFromStrapi<StrapiInfo>("/info?populate=*");
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
