import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

// ─── Énumérations ───────────────────────────────────────────────────────────

/** Les 4 colonnes de la section « Compétences » du site. */
export const skillCategory = pgEnum('skill_category', ['frontend', 'backend', 'mobile', 'tools']);

/** Type de projet : site web, application mobile ou logiciel desktop. */
export const projectCategory = pgEnum('project_category', ['web', 'mobile', 'desktop']);

/** Où en est le projet : badge affiché sur la carte. */
export const projectStatus = pgEnum('project_status', ['live', 'completed', 'coming_soon', 'in_progress']);

/** Cadre du projet : mission client, projet perso, projet d'études ou stage. */
export const projectContext = pgEnum('project_context', ['client', 'personal', 'academic', 'internship']);

// ─── Langues ────────────────────────────────────────────────────────────────

/**
 * Le site est en 4 langues. Le français est la langue de référence :
 * chaque texte a une colonne de base (en français) et trois traductions
 * facultatives (« …En », « …Es », « …Ar »). Une traduction vide (NULL)
 * est remplacée par le français côté API, le site n'a jamais de trou.
 */
export const LOCALES = ['fr', 'en', 'es', 'ar'] as const;

/** Plateformes d'un sous-projet. */
export const PLATFORMS = ['web', 'android', 'ios', 'desktop'] as const;
export type Platform = (typeof PLATFORMS)[number];
export type Locale = (typeof LOCALES)[number];

// ─── Administrateur (un seul compte) ────────────────────────────────────────

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 60 }).notNull(),
  lastName: varchar('last_name', { length: 60 }).notNull().default(''),
  login: varchar('login', { length: 160 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Informations personnelles (une seule ligne, id = 1) ────────────────────

/**
 * Le « À propos » du site : identité, photo, CV, contacts, statistiques et réseaux.
 * Les réseaux sont tous facultatifs : vide (NULL) = le bouton ne s'affiche pas sur le site.
 * On stocke le pseudo seul (« Rayane-62 »), l'API construit le lien complet.
 */
export const info = pgTable('info', {
  id: integer('id').primaryKey().default(1),
  name: varchar('name', { length: 120 }).notNull().default(''),
  /** Nom écrit en arabe (affiché seulement sur la version arabe du site). */
  nameAr: varchar('name_ar', { length: 120 }),

  title: varchar('title', { length: 160 }).notNull().default(''),
  titleEn: varchar('title_en', { length: 160 }),
  titleEs: varchar('title_es', { length: 160 }),
  titleAr: varchar('title_ar', { length: 160 }),

  bio: text('bio').notNull().default(''),
  bioEn: text('bio_en'),
  bioEs: text('bio_es'),
  bioAr: text('bio_ar'),

  photoUrl: text('photo_url'),
  photoPublicId: text('photo_public_id'),
  /** CV au format PDF, stocké tel quel (pas de conversion). */
  cvUrl: text('cv_url'),
  cvPublicId: text('cv_public_id'),

  email: varchar('email', { length: 160 }).notNull().default(''),
  phone: varchar('phone', { length: 30 }).notNull().default(''),
  whatsapp: varchar('whatsapp', { length: 30 }).notNull().default(''),
  /** false = bandeau « pas disponible en ce moment » sur le site. */
  available: boolean('available').notNull().default(true),

  statsProjects: integer('stats_projects').notNull().default(0),
  statsExperience: integer('stats_experience').notNull().default(0),
  statsClients: integer('stats_clients').notNull().default(0),

  // Réseaux : tous facultatifs, vides par défaut.
  github: varchar('github', { length: 160 }),
  linkedin: varchar('linkedin', { length: 160 }),
  instagram: varchar('instagram', { length: 160 }),
  facebook: varchar('facebook', { length: 160 }),
  x: varchar('x', { length: 160 }),
  youtube: varchar('youtube', { length: 160 }),
  behance: varchar('behance', { length: 160 }),
  dribbble: varchar('dribbble', { length: 160 }),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Compétences ────────────────────────────────────────────────────────────

/** Une compétence = un logo (devicon) + un nom, rangée dans une des 4 catégories. */
export const skills = pgTable(
  'skills',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 80 }).notNull(),
    /** Logo, en général une URL du CDN devicon. */
    iconUrl: text('icon_url').notNull().default(''),
    category: skillCategory('category').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('skills_name_uniq').on(sql`lower(${t.name})`), index('skills_category_idx').on(t.category)],
);

// ─── Parcours professionnel ─────────────────────────────────────────────────

/** « position » = l'intitulé du poste ; « order » = l'ordre d'affichage. */
export const experiences = pgTable(
  'experiences',
  {
    id: serial('id').primaryKey(),
    position: varchar('position', { length: 160 }).notNull(),
    positionEn: varchar('position_en', { length: 160 }),
    positionEs: varchar('position_es', { length: 160 }),
    positionAr: varchar('position_ar', { length: 160 }),

    company: varchar('company', { length: 160 }).notNull(),
    companyEn: varchar('company_en', { length: 160 }),
    companyEs: varchar('company_es', { length: 160 }),
    companyAr: varchar('company_ar', { length: 160 }),

    /** Dates écrites librement : « Juin 2025 → Présent ». */
    period: varchar('period', { length: 120 }).notNull(),
    periodEn: varchar('period_en', { length: 120 }),
    periodEs: varchar('period_es', { length: 120 }),
    periodAr: varchar('period_ar', { length: 120 }),

    description: text('description').notNull().default(''),
    descriptionEn: text('description_en'),
    descriptionEs: text('description_es'),
    descriptionAr: text('description_ar'),

    /** Technologies utilisées : ['HTML', 'Angular', …]. */
    technologies: jsonb('technologies').$type<string[]>().notNull().default([]),
    /** true = poste en cours (badge « Actuel » sur le site). */
    current: boolean('current').notNull().default(false),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('experiences_order_idx').on(t.order)],
);

// ─── Formation ──────────────────────────────────────────────────────────────

export const educations = pgTable(
  'educations',
  {
    id: serial('id').primaryKey(),
    degree: varchar('degree', { length: 200 }).notNull(),
    degreeEn: varchar('degree_en', { length: 200 }),
    degreeEs: varchar('degree_es', { length: 200 }),
    degreeAr: varchar('degree_ar', { length: 200 }),

    institution: varchar('institution', { length: 200 }).notNull(),
    institutionEn: varchar('institution_en', { length: 200 }),
    institutionEs: varchar('institution_es', { length: 200 }),
    institutionAr: varchar('institution_ar', { length: 200 }),

    period: varchar('period', { length: 120 }).notNull(),
    periodEn: varchar('period_en', { length: 120 }),
    periodEs: varchar('period_es', { length: 120 }),
    periodAr: varchar('period_ar', { length: 120 }),

    /** Facultative : NULL = pas de texte sous le diplôme. */
    description: text('description'),
    descriptionEn: text('description_en'),
    descriptionEs: text('description_es'),
    descriptionAr: text('description_ar'),

    /** true = diplôme en cours (badge « En cours »). */
    current: boolean('current').notNull().default(false),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('educations_order_idx').on(t.order)],
);

// ─── Projets ────────────────────────────────────────────────────────────────

/** La table part vide : le propriétaire ajoute ses projets depuis l'admin. */
export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 160 }).notNull(),
    titleEn: varchar('title_en', { length: 160 }),
    titleEs: varchar('title_es', { length: 160 }),
    titleAr: varchar('title_ar', { length: 160 }),

    /** Une ou deux phrases pour la carte. Vide = début de la description. */
    summary: text('summary').notNull().default(''),
    summaryEn: text('summary_en'),
    summaryEs: text('summary_es'),
    summaryAr: text('summary_ar'),

    /** Texte complet, affiché dans la fenêtre de détail. */
    description: text('description').notNull().default(''),
    descriptionEn: text('description_en'),
    descriptionEs: text('description_es'),
    descriptionAr: text('description_ar'),

    /** Fonctionnalités clés, une par ligne. */
    features: text('features').notNull().default(''),
    featuresEn: text('features_en'),
    featuresEs: text('features_es'),
    featuresAr: text('features_ar'),

    /** Points forts techniques, un par ligne. */
    highlights: text('highlights').notNull().default(''),
    highlightsEn: text('highlights_en'),
    highlightsEs: text('highlights_es'),
    highlightsAr: text('highlights_ar'),

    /** Un projet peut être à la fois web et mobile : ['web', 'mobile']. */
    categories: jsonb('categories').$type<ProjectCategory[]>().notNull().default([]),
    status: projectStatus('status').notNull().default('completed'),
    /** NULL = non précisé (rien n'est affiché). */
    context: projectContext('context'),
    /** true = badge « Projet en équipe ». */
    team: boolean('team').notNull().default(false),
    /** true = les parties sont des sous-projets complets (Quick : app livreur, web partenaire…). */
    hasSubprojects: boolean('has_subprojects').notNull().default(false),
    technologies: jsonb('technologies').$type<string[]>().notNull().default([]),

    /** Image de couverture. NULL = la 1re photo de la galerie. */
    imageUrl: text('image_url'),
    imagePublicId: text('image_public_id'),
    /** Lien vers le site / l'application en ligne. NULL = pas de bouton. */
    liveUrl: text('live_url'),
    githubUrl: text('github_url'),

    /** Mis en avant en haut de la section « Projets ». */
    featured: boolean('featured').notNull().default(false),
    /** false = gardé dans l'admin mais masqué sur le site. */
    visible: boolean('visible').notNull().default(true),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('projects_visible_idx').on(t.visible), index('projects_order_idx').on(t.order)],
);

/**
 * Une partie d'un projet (« Site admin », « App livreurs »…) et sa galerie.
 * Sur le site, chaque partie devient un onglet de la fenêtre de détail.
 */
export const projectSections = pgTable(
  'project_sections',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    titleEn: varchar('title_en', { length: 120 }),
    titleEs: varchar('title_es', { length: 120 }),
    titleAr: varchar('title_ar', { length: 120 }),
    /** Facultatif : « Web · Android · iOS », « Back-office interne »… */
    subtitle: varchar('subtitle', { length: 200 }),
    subtitleEn: varchar('subtitle_en', { length: 200 }),
    subtitleEs: varchar('subtitle_es', { length: 200 }),
    subtitleAr: varchar('subtitle_ar', { length: 200 }),

    // Champs utilisés quand le projet a des sous-projets (hasSubprojects).
    description: text('description'),
    descriptionEn: text('description_en'),
    descriptionEs: text('description_es'),
    descriptionAr: text('description_ar'),
    /** Une fonctionnalité par ligne. */
    features: text('features').notNull().default(''),
    featuresEn: text('features_en'),
    featuresEs: text('features_es'),
    featuresAr: text('features_ar'),
    /** ['web', 'android', 'ios', 'desktop'] */
    platforms: jsonb('platforms').$type<Platform[]>().notNull().default([]),
    technologies: jsonb('technologies').$type<string[]>().notNull().default([]),
    liveUrl: text('live_url'),
    githubUrl: text('github_url'),

    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('project_sections_project_idx').on(t.projectId, t.order)],
);

/** Une capture d'écran d'une partie. Largeur et hauteur servent à distinguer paysage et portrait (mobile). */
export const projectImages = pgTable(
  'project_images',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => projectSections.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    publicId: text('public_id').notNull(),
    width: integer('width').notNull().default(0),
    height: integer('height').notNull().default(0),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('project_images_section_idx').on(t.sectionId, t.order)],
);

// ─── Messages du formulaire de contact ──────────────────────────────────────

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 160 }).notNull(),
    /** Facultatif : le/la client(e) peut préférer être rappelé(e). */
    phone: varchar('phone', { length: 30 }),
    subject: varchar('subject', { length: 200 }).notNull(),
    message: text('message').notNull(),
    /** false = pas encore lu (compteur rouge dans l'admin). */
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_created_idx').on(t.createdAt), index('messages_read_idx').on(t.read)],
);

// ─── Types utiles ───────────────────────────────────────────────────────────

export type Admin = typeof admins.$inferSelect;
export type Info = typeof info.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type SkillCategory = (typeof skillCategory.enumValues)[number];
export type Experience = typeof experiences.$inferSelect;
export type Education = typeof educations.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectCategory = (typeof projectCategory.enumValues)[number];
export type ProjectStatus = (typeof projectStatus.enumValues)[number];
export type ProjectContext = (typeof projectContext.enumValues)[number];
export type ProjectSection = typeof projectSections.$inferSelect;
export type ProjectImage = typeof projectImages.$inferSelect;
export type Message = typeof messages.$inferSelect;

/** Les réseaux gérés par l'admin, dans l'ordre d'affichage sur le site. */
export const SOCIAL_KEYS = ['github', 'linkedin', 'instagram', 'facebook', 'x', 'youtube', 'behance', 'dribbble'] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
