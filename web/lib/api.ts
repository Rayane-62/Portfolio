/**
 * Accès à l'API du portfolio (NestJS, port 4300).
 *
 * `GET /public/portfolio?locale=…` renvoie tout le contenu du site en une
 * requête, déjà traduit : le front n'a aucune logique de langue à écrire.
 */

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4300/api"
).replace(/\/$/, "");

export const LOCALES = ["fr", "en", "es", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const SOCIAL_KEYS = [
  "github",
  "linkedin",
  "instagram",
  "facebook",
  "x",
  "youtube",
  "tiktok",
] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

/** L'API renvoie `null` pour un réseau non renseigné : rien ne s'affiche. */
export type Socials = Record<SocialKey, string | null>;

export type Info = {
  name: string;
  nameLatin: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  cvUrl: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  whatsappLink: string | null;
  available: boolean;
  stats: { projects: number; experience: number; clients: number };
  socials: Socials;
};

export type SkillCategory = "frontend" | "backend" | "mobile" | "tools";

export type Skill = {
  id: number;
  name: string;
  iconUrl: string | null;
};

/** Les compétences arrivent déjà rangées par catégorie. */
export type SkillGroups = Record<SkillCategory, Skill[]>;

export type Experience = {
  id: number;
  position: string;
  company: string;
  period: string;
  description: string;
  technologies: string[] | null;
  current: boolean;
};

export type Education = {
  id: number;
  degree: string;
  institution: string;
  period: string;
  description: string | null;
  current: boolean;
};

export type ProjectCategory = "web" | "mobile" | "desktop";
export type ProjectStatus = "live" | "completed" | "coming_soon" | "in_progress";
export type ProjectContext = "client" | "personal" | "academic" | "internship";
/** Liens d'un projet ou d'un sous-projet. null / [] = pas de bouton. */
export type ProjectLinkSet = {
  liveUrl: string | null;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  downloadUrl: string | null;
  /** 0 à 2 dépôts, chacun avec un nom facultatif (« Front », « Back »). */
  repos: { label: string; url: string }[];
};

export type ProjectImage = {
  id: number;
  url: string;
  width: number;
  height: number;
};

/**
 * Galerie simple : un onglet (une partie qui a des photos).
 * Projet avec sous-projets : un sous-projet complet.
 */
export type ProjectSection = {
  id: number;
  title: string;
  subtitle: string | null;
  /** Texte court de la carte du sous-projet. */
  summary: string | null;
  /** null = pas de badge. */
  status: ProjectStatus | null;
  description: string | null;
  features: string[];
  highlights: string[];
  /** Web, mobile ou logiciel. null = non précisé. */
  kind: ProjectCategory | null;
  technologies: string[];
  images: ProjectImage[];
} & ProjectLinkSet;

export type Project = {
  id: number;
  title: string;
  /** Texte court de la carte. */
  summary: string | null;
  description: string | null;
  features: string[];
  highlights: string[];
  categories: ProjectCategory[];
  status: ProjectStatus;
  context: ProjectContext | null;
  team: boolean;
  hasSubprojects: boolean;
  technologies: string[];
  /** Couverture : image choisie ou 1re photo de la galerie. */
  coverUrl: string | null;
  featured: boolean;
  sections: ProjectSection[];
  /** Toutes les parties, y compris celles sans photo. */
  parts: { title: string; subtitle: string | null }[];
} & ProjectLinkSet;

export type Portfolio = {
  locale: Locale;
  info: Info;
  skills: SkillGroups;
  experiences: Experience[];
  educations: Education[];
  projects: Project[];
};

const EMPTY_SKILLS: SkillGroups = {
  frontend: [],
  backend: [],
  mobile: [],
  tools: [],
};

/**
 * Contenu de secours : l'API injoignable ne doit pas faire tomber la page.
 * Volontairement minimal — les vraies données viennent toujours de l'API.
 */
const FALLBACK_INFO: Info = {
  name: "BENLALAM Mohamed Rayane",
  nameLatin: "BENLALAM Mohamed Rayane",
  title: "Développeur Full Stack",
  bio: "",
  photoUrl: null,
  cvUrl: null,
  email: "benlalamrayane@gmail.com",
  phone: null,
  whatsapp: null,
  whatsappLink: null,
  available: true,
  stats: { projects: 0, experience: 0, clients: 0 },
  socials: {
    github: null,
    linkedin: null,
    instagram: null,
    facebook: null,
    x: null,
    youtube: null,
    tiktok: null,
  },
};

/**
 * Normalise la réponse : une clé absente — ou mise à `null` par l'API quand le
 * champ n'est pas rempli — ne doit jamais casser le rendu.
 */
function normalize(raw: unknown, locale: Locale): Portfolio {
  const data = (raw ?? {}) as Partial<Portfolio>;
  const info = { ...FALLBACK_INFO, ...(data.info ?? {}) } as Info;

  return {
    locale,
    info: {
      ...info,
      name: info.name || FALLBACK_INFO.name,
      nameLatin: info.nameLatin || FALLBACK_INFO.nameLatin,
      title: info.title || FALLBACK_INFO.title,
      bio: info.bio || "",
      email: info.email || FALLBACK_INFO.email,
      stats: { ...FALLBACK_INFO.stats, ...(info.stats ?? {}) },
      socials: { ...FALLBACK_INFO.socials, ...(info.socials ?? {}) },
    },
    skills: { ...EMPTY_SKILLS, ...(data.skills ?? {}) },
    experiences: Array.isArray(data.experiences) ? data.experiences : [],
    educations: Array.isArray(data.educations) ? data.educations : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((p) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : [],
          highlights: Array.isArray(p.highlights) ? p.highlights : [],
          categories: Array.isArray(p.categories) ? p.categories : [],
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
          hasSubprojects: !!p.hasSubprojects,
          repos: Array.isArray(p.repos) ? p.repos : [],
          sections: Array.isArray(p.sections)
            ? p.sections.map((s) => ({
                ...s,
                features: Array.isArray(s.features) ? s.features : [],
                highlights: Array.isArray(s.highlights) ? s.highlights : [],
                repos: Array.isArray(s.repos) ? s.repos : [],
                technologies: Array.isArray(s.technologies) ? s.technologies : [],
                images: Array.isArray(s.images) ? s.images : [],
              }))
            : [],
          parts: Array.isArray(p.parts) ? p.parts : [],
          status: p.status ?? "completed",
        }))
      : [],
  };
}

/** Tout le contenu du site, pour une langue. */
export async function getPortfolio(locale: Locale): Promise<Portfolio> {
  try {
    const res = await fetch(`${API_URL}/public/portfolio?locale=${locale}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return normalize(null, locale);
    return normalize(await res.json(), locale);
  } catch {
    return normalize(null, locale);
  }
}

// ─── Formulaire de contact ──────────────────────────────────────────────────

export type ContactInput = {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
};

export type ContactResult =
  | { ok: true; id: number }
  | { ok: false; reason: "rate-limit" | "invalid" | "network"; detail?: string };

/**
 * Envoi depuis le navigateur : la limite de l'API (10 messages / 10 min) se
 * compte par IP, elle doit donc voir l'IP du visiteur et pas celle du serveur.
 */
export async function sendContact(input: ContactInput): Promise<ContactResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, reason: "network" };
  }

  if (res.ok) {
    try {
      const json = (await res.json()) as { id?: number };
      return { ok: true, id: json.id ?? 0 };
    } catch {
      return { ok: true, id: 0 };
    }
  }

  if (res.status === 429) return { ok: false, reason: "rate-limit" };

  let detail: string | undefined;
  try {
    const json = (await res.json()) as { message?: string | string[] };
    detail = Array.isArray(json.message) ? json.message[0] : json.message;
  } catch {
    detail = undefined;
  }

  if (res.status === 400) return { ok: false, reason: "invalid", detail };
  return { ok: false, reason: "network", detail };
}
