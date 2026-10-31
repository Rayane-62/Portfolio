/**
 * Reprise du contenu qui était dans Strapi.
 *
 *   npm run db:import                          → lit data/strapi-content.json
 *   npm run db:import -- /chemin/content.json  → lit un autre fichier
 *   CONTENT_FILE=/chemin/content.json npm run db:import
 *
 * Le fichier est l'export de Strapi : ses colonnes sont écrites en snake_case
 * (« icon_url », « title_en », « stats_projects », « name_ar »), on les remet
 * au format de la base au passage.
 *
 * Le script peut être relancé autant de fois qu'on veut : rien n'est dupliqué.
 * Ce qui existe déjà est mis à jour, ce qui manque est ajouté. Les éléments
 * ajoutés à la main dans l'admin ne sont jamais supprimés.
 *
 *   • informations : la ligne id = 1 est remplie (ou mise à jour)
 *   • compétences  : reconnues par leur nom
 *   • expériences  : reconnues par poste + entreprise
 *   • formations   : reconnues par diplôme + établissement
 *   • projets      : reconnus par titre (le fichier de Strapi n'en contient aucun)
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { cleanHandle } from '../common/text';
import { createDb, createPool, type Database } from './client';
import {
  educations,
  experiences,
  info,
  projectCategory,
  type ProjectCategory,
  projects,
  skillCategory,
  type SkillCategory,
  skills,
  SOCIAL_KEYS,
} from './schema';

const DEFAULT_FILE = 'data/strapi-content.json';

type Row = Record<string, unknown>;

// ─── Lecture du fichier de Strapi ───────────────────────────────────────────

function str(row: Row, key: string): string | null {
  const v = row[key];
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function num(row: Row, key: string, fallback = 0): number {
  const v = row[key];
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** Strapi écrit les booléens en 0 / 1. */
function bool(row: Row, key: string, fallback = false): boolean {
  const v = row[key];
  if (v == null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return !['0', 'false', 'null', ''].includes(String(v).trim().toLowerCase());
}

/** Les technologies arrivent soit en tableau, soit en texte JSON (« ["HTML","PHP"] »). */
function list(row: Row, key: string): string[] {
  const v = row[key];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      // Pas du JSON : on accepte aussi « HTML, PHP, MySQL ».
      return v.split(',').map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

/** Les quatre colonnes d'un champ traduit : « title » → title, titleEn, titleEs, titleAr. */
function translated(row: Row, snake: string, camel: string) {
  return {
    [camel]: str(row, snake) ?? '',
    [`${camel}En`]: str(row, `${snake}_en`),
    [`${camel}Es`]: str(row, `${snake}_es`),
    [`${camel}Ar`]: str(row, `${snake}_ar`),
  } as Record<string, string | null>;
}

/** Clé de comparaison : insensible à la casse et aux espaces en trop. */
function key(...parts: (string | null | undefined)[]): string {
  return parts.map((p) => (p ?? '').trim().toLowerCase().replace(/\s+/g, ' ')).join(' | ');
}

// ─── Reprise de chaque table ────────────────────────────────────────────────

async function importInfo(db: Database, row: Row | undefined) {
  if (!row) return '• informations : absentes du fichier, rien à faire';
  const values = {
    id: 1,
    name: str(row, 'name') ?? '',
    nameAr: str(row, 'name_ar'),
    ...translated(row, 'title', 'title'),
    ...translated(row, 'bio', 'bio'),
    email: str(row, 'email') ?? '',
    phone: str(row, 'phone') ?? '',
    whatsapp: str(row, 'whatsapp') ?? '',
    available: bool(row, 'available', true),
    statsProjects: num(row, 'stats_projects'),
    statsExperience: num(row, 'stats_experience'),
    statsClients: num(row, 'stats_clients'),
    // Photo et CV ne sont pas dans l'export : ils sont renvoyés depuis l'admin.
    ...Object.fromEntries(SOCIAL_KEYS.map((k) => [k, cleanHandle(str(row, k), k)])),
    updatedAt: new Date(),
  } as typeof info.$inferInsert;

  // La ligne existe peut-être déjà (npm run db:seed) : on la remplit sans la dupliquer.
  const { id: _id, ...patch } = values;
  await db.insert(info).values(values).onConflictDoUpdate({ target: info.id, set: patch });
  return `✓ informations : « ${values.name} »${values.nameAr ? ` / « ${values.nameAr} »` : ''}`;
}

async function importSkills(db: Database, rows: Row[]) {
  if (!rows.length) return '• compétences : aucune dans le fichier';
  const existing = await db.select().from(skills);
  const byName = new Map(existing.map((s) => [key(s.name), s]));
  let added = 0;
  let updated = 0;

  for (const [i, row] of rows.entries()) {
    const name = str(row, 'name');
    if (!name) continue;
    const category = str(row, 'category');
    if (!category || !(skillCategory.enumValues as readonly string[]).includes(category)) {
      throw new Error(`compétence « ${name} » : catégorie « ${category} » inconnue (frontend, backend, mobile ou tools)`);
    }
    const values = {
      name,
      iconUrl: str(row, 'icon_url') ?? '',
      category: category as SkillCategory,
      position: num(row, 'position', i),
    };
    const found = byName.get(key(name));
    if (found) {
      await db.update(skills).set(values).where(eq(skills.id, found.id));
      updated++;
    } else {
      await db.insert(skills).values(values);
      added++;
    }
  }
  return `✓ compétences : ${added} ajoutée(s), ${updated} mise(s) à jour`;
}

async function importExperiences(db: Database, rows: Row[]) {
  if (!rows.length) return '• expériences : aucune dans le fichier';
  const existing = await db.select().from(experiences);
  const byKey = new Map(existing.map((e) => [key(e.position, e.company), e]));
  let added = 0;
  let updated = 0;

  for (const [i, row] of rows.entries()) {
    const position = str(row, 'position');
    const company = str(row, 'company');
    if (!position || !company) continue;
    const values = {
      ...translated(row, 'position', 'position'),
      ...translated(row, 'company', 'company'),
      ...translated(row, 'period', 'period'),
      ...translated(row, 'description', 'description'),
      technologies: list(row, 'technologies'),
      current: bool(row, 'current'),
      order: num(row, 'order', i + 1),
      updatedAt: new Date(),
    } as typeof experiences.$inferInsert;
    const found = byKey.get(key(position, company));
    if (found) {
      await db.update(experiences).set(values).where(eq(experiences.id, found.id));
      updated++;
    } else {
      await db.insert(experiences).values(values);
      added++;
    }
  }
  return `✓ expériences : ${added} ajoutée(s), ${updated} mise(s) à jour`;
}

async function importEducations(db: Database, rows: Row[]) {
  if (!rows.length) return '• formations : aucune dans le fichier';
  const existing = await db.select().from(educations);
  const byKey = new Map(existing.map((e) => [key(e.degree, e.institution), e]));
  let added = 0;
  let updated = 0;

  for (const [i, row] of rows.entries()) {
    const degree = str(row, 'degree');
    const institution = str(row, 'institution');
    if (!degree || !institution) continue;
    const values = {
      ...translated(row, 'degree', 'degree'),
      ...translated(row, 'institution', 'institution'),
      ...translated(row, 'period', 'period'),
      ...translated(row, 'description', 'description'),
      // La description d'une formation est facultative : vide = NULL, pas de texte sous le diplôme.
      description: str(row, 'description'),
      current: bool(row, 'current'),
      order: num(row, 'order', i + 1),
      updatedAt: new Date(),
    } as typeof educations.$inferInsert;
    const found = byKey.get(key(degree, institution));
    if (found) {
      await db.update(educations).set(values).where(eq(educations.id, found.id));
      updated++;
    } else {
      await db.insert(educations).values(values);
      added++;
    }
  }
  return `✓ formations : ${added} ajoutée(s), ${updated} mise(s) à jour`;
}

/** Le fichier de Strapi ne contient aucun projet : la section part vide, c'est voulu. */
async function importProjects(db: Database, rows: Row[]) {
  if (!rows.length) return '• projets : aucun dans le fichier (normal : ils sont ajoutés depuis l\'admin)';
  const existing = await db.select().from(projects);
  const byTitle = new Map(existing.map((p) => [key(p.title), p]));
  let added = 0;
  let updated = 0;

  for (const [i, row] of rows.entries()) {
    const title = str(row, 'title');
    if (!title) continue;
    const category = str(row, 'category') ?? 'web';
    if (!(projectCategory.enumValues as readonly string[]).includes(category)) {
      throw new Error(`projet « ${title} » : catégorie « ${category} » inconnue (web, mobile ou desktop)`);
    }
    const values = {
      ...translated(row, 'title', 'title'),
      ...translated(row, 'description', 'description'),
      category: category as ProjectCategory,
      technologies: list(row, 'technologies'),
      imageUrl: str(row, 'image_url'),
      imagePublicId: str(row, 'image_public_id'),
      liveUrl: str(row, 'live_url'),
      githubUrl: str(row, 'github_url'),
      featured: bool(row, 'featured'),
      visible: bool(row, 'visible', true),
      order: num(row, 'order', i + 1),
      updatedAt: new Date(),
    } as typeof projects.$inferInsert;
    const found = byTitle.get(key(title));
    if (found) {
      await db.update(projects).set(values).where(eq(projects.id, found.id));
      updated++;
    } else {
      await db.insert(projects).values(values);
      added++;
    }
  }
  return `✓ projets : ${added} ajouté(s), ${updated} mis à jour`;
}

// ─── Programme ──────────────────────────────────────────────────────────────

async function main() {
  const file = resolve(process.argv[2] || process.env.CONTENT_FILE || DEFAULT_FILE);
  console.log(`→ Lecture de ${file}`);

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(
      `fichier illisible (${file}) : ${(err as Error).message}\n` +
        '  Donne le bon chemin : npm run db:import -- /chemin/vers/content.json',
    );
  }

  const rows = (k: string): Row[] => (Array.isArray(data[k]) ? (data[k] as Row[]) : []);
  const pool = createPool();
  const db = createDb(pool);
  try {
    console.log(await importInfo(db, (data.info as Row) ?? undefined));
    console.log(await importSkills(db, rows('skills')));
    console.log(await importExperiences(db, rows('experiences')));
    console.log(await importEducations(db, rows('educations')));
    console.log(await importProjects(db, rows('projects')));
  } finally {
    await pool.end();
  }
  console.log('Terminé. Relancer la commande ne créera pas de doublon.');
}

main().catch((err) => {
  console.error('✗ Échec de la reprise :', err instanceof Error ? err.message : err);
  process.exit(1);
});
