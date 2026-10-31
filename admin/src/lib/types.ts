/** Types renvoyés par l'API admin (voir le README du backend, « Référence API »). */

export type Locale = 'fr' | 'en' | 'es' | 'ar';
export type SkillCategory = 'frontend' | 'backend' | 'mobile' | 'tools';
export type ProjectCategory = 'web' | 'mobile' | 'desktop';
export type SocialKey = 'github' | 'linkedin' | 'instagram' | 'facebook' | 'x' | 'youtube' | 'behance' | 'dribbble';

export interface Me {
  id: number;
  firstName: string;
  lastName: string;
  login: string;
  mustChangePassword: boolean;
}

/** « Mes informations » : une seule ligne (id = 1), créée automatiquement par l'API. */
export interface Info {
  id: number;
  name: string;
  /** Nom écrit en arabe, affiché seulement sur la version arabe du site. */
  nameAr: string | null;
  title: string;
  titleEn: string | null;
  titleEs: string | null;
  titleAr: string | null;
  bio: string;
  bioEn: string | null;
  bioEs: string | null;
  bioAr: string | null;
  photoUrl: string | null;
  photoPublicId: string | null;
  /** CV au format PDF, gardé tel quel. */
  cvUrl: string | null;
  cvPublicId: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  /** false = bandeau « pas disponible en ce moment » sur le site. */
  available: boolean;
  statsProjects: number;
  statsExperience: number;
  statsClients: number;
  /** Réseaux : le pseudo seul (« Rayane-62 »), ou null = rien sur le site. */
  github: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  youtube: string | null;
  behance: string | null;
  dribbble: string | null;
  updatedAt: string;
}

export interface Skill {
  id: number;
  name: string;
  /** Logo, en général une URL du CDN devicon. '' = pas de logo. */
  iconUrl: string;
  category: SkillCategory;
  position: number;
  createdAt: string;
}

export interface Experience {
  id: number;
  /** L'intitulé du poste. */
  position: string;
  positionEn: string | null;
  positionEs: string | null;
  positionAr: string | null;
  company: string;
  companyEn: string | null;
  companyEs: string | null;
  companyAr: string | null;
  /** Dates écrites librement : « Juin 2025 → Présent ». */
  period: string;
  periodEn: string | null;
  periodEs: string | null;
  periodAr: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  descriptionAr: string | null;
  technologies: string[];
  /** true = poste en cours (badge « Actuel » sur le site). */
  current: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  id: number;
  degree: string;
  degreeEn: string | null;
  degreeEs: string | null;
  degreeAr: string | null;
  institution: string;
  institutionEn: string | null;
  institutionEs: string | null;
  institutionAr: string | null;
  period: string;
  periodEn: string | null;
  periodEs: string | null;
  periodAr: string | null;
  /** Facultative : null = rien sous le diplôme. */
  description: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  descriptionAr: string | null;
  current: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  titleEn: string | null;
  titleEs: string | null;
  titleAr: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  descriptionAr: string | null;
  category: ProjectCategory;
  technologies: string[];
  imageUrl: string | null;
  imagePublicId: string | null;
  /** Lien du site / de l'application en ligne. null = pas de bouton. */
  liveUrl: string | null;
  githubUrl: string | null;
  /** Remonté en haut de la section « Projets » du site. */
  featured: boolean;
  /** false = gardé ici, masqué sur le site. */
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  /** Facultatif : certaines personnes préfèrent être rappelées. */
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MessageList {
  items: Message[];
  total: number;
  unread: number;
  page: number;
  pages: number;
}

export interface Dashboard {
  counts: {
    projects: number;
    projectsVisible: number;
    projectsHidden: number;
    projectsFeatured: number;
    skills: number;
    experiences: number;
    educations: number;
    messages: number;
    unreadMessages: number;
  };
  /** Les 5 derniers messages reçus. */
  lastMessages: Pick<Message, 'id' | 'name' | 'email' | 'phone' | 'subject' | 'read' | 'createdAt'>[];
  /** Rappels de l'API : ce qui manque encore pour que le site soit complet. */
  todo: { photo: boolean; cv: boolean; projects: boolean; bio: boolean };
  available: boolean;
}

export type LiveEvent =
  | { type: 'hello' }
  | { type: 'message.created'; messageId: number; name: string; subject: string }
  | { type: 'message.updated'; messageId: number }
  | { type: 'message.deleted'; messageId: number }
  | { type: 'content.updated'; what: 'info' | 'skills' | 'experiences' | 'educations' | 'projects' };
