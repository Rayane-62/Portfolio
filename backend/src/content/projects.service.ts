import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { EventsService } from '../events/events.service';
import { projectImages, projects, projectSections, type ProjectImage, type ProjectSection } from '../db/schema';
import { UploadsService } from '../uploads/uploads.service';
import { AdminProjectQuery, CreateProjectDto, CreateSectionDto, UpdateProjectDto, UpdateSectionDto } from './content.dto';

/** Champs modifiables, traductions comprises. */
const FIELDS = [
  'title', 'titleEn', 'titleEs', 'titleAr',
  'summary', 'summaryEn', 'summaryEs', 'summaryAr',
  'description', 'descriptionEn', 'descriptionEs', 'descriptionAr',
  'features', 'featuresEn', 'featuresEs', 'featuresAr',
  'highlights', 'highlightsEn', 'highlightsEs', 'highlightsAr',
  'categories', 'status', 'context', 'team', 'hasSubprojects',
  'technologies', 'imageUrl', 'imagePublicId', 'liveUrl', 'githubUrl', 'featured', 'visible',
] as const;

const SECTION_FIELDS = [
  'title', 'titleEn', 'titleEs', 'titleAr',
  'subtitle', 'subtitleEn', 'subtitleEs', 'subtitleAr',
  'summary', 'summaryEn', 'summaryEs', 'summaryAr', 'status',
  'description', 'descriptionEn', 'descriptionEs', 'descriptionAr',
  'features', 'featuresEn', 'featuresEs', 'featuresAr',
  'highlights', 'highlightsEn', 'highlightsEs', 'highlightsAr',
  'platforms', 'technologies', 'liveUrl', 'githubUrl',
] as const;

export type SectionWithImages = ProjectSection & { images: ProjectImage[] };

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly uploads: UploadsService,
    private readonly events: EventsService,
  ) {}

  /**
   * Liste de l'admin : tout, masqués compris. ?category=&filter=visible|masque|featured
   * Chaque projet porte sa couverture (image choisie ou 1re photo de la galerie) et son nombre de photos.
   */
  async listAdmin(query: AdminProjectQuery = {}) {
    const where: SQL[] = [];
    if (query.category) where.push(sql`${projects.categories} @> ${JSON.stringify([query.category])}::jsonb`);
    if (query.filter === 'visible') where.push(eq(projects.visible, true));
    if (query.filter === 'masque') where.push(eq(projects.visible, false));
    if (query.filter === 'featured') where.push(eq(projects.featured, true));
    const rows = await this.db
      .select()
      .from(projects)
      .where(where.length ? and(...where) : undefined)
      .orderBy(asc(projects.order), desc(projects.id));
    const galleries = await this.sectionsOf(rows.map((p) => p.id));
    return rows.map((p) => {
      const sections = galleries.get(p.id) ?? [];
      return {
        ...p,
        coverUrl: coverOf(p.imageUrl, sections),
        sectionCount: sections.length,
        imageCount: sections.reduce((n, s) => n + s.images.length, 0),
      };
    });
  }

  /** Liste du site : seulement les projets affichés, les mis en avant d'abord, avec leurs galeries. */
  async listPublic() {
    const rows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.visible, true))
      .orderBy(desc(projects.featured), asc(projects.order), asc(projects.id));
    const galleries = await this.sectionsOf(rows.map((p) => p.id));
    return rows.map((p) => ({ ...p, sections: galleries.get(p.id) ?? [] }));
  }

  async create(dto: CreateProjectDto) {
    const [row] = await this.db
      .insert(projects)
      .values({
        ...this.patch(dto),
        title: dto.title,
        description: dto.description ?? '',
        categories: dto.categories,
        technologies: dto.technologies ?? [],
        order: (await this.lastOrder()) + 1,
      })
      .returning();
    this.changed();
    return row;
  }

  async update(id: number, dto: UpdateProjectDto) {
    const current = await this.get(id);
    const [row] = await this.db
      .update(projects)
      .set({ ...this.patch(dto), updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    // Image remplacée ou retirée : l'ancien fichier ne sert plus à rien.
    if (dto.imagePublicId !== undefined && current.imagePublicId && current.imagePublicId !== dto.imagePublicId) {
      await this.uploads.remove(current.imagePublicId);
    }
    this.changed();
    return row;
  }

  /** Afficher / masquer sur le site sans perdre le projet. */
  async setVisible(id: number, visible: boolean) {
    await this.get(id);
    const [row] = await this.db
      .update(projects)
      .set({ visible, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    this.changed();
    return row;
  }

  /** Supprime le projet, ses parties et toutes ses photos (fichiers compris). */
  async remove(id: number) {
    const current = await this.get(id);
    const sections = (await this.sectionsOf([id])).get(id) ?? [];
    await this.db.delete(projects).where(eq(projects.id, id));
    await this.uploads.remove(current.imagePublicId);
    for (const s of sections) for (const img of s.images) await this.uploads.remove(img.publicId);
    this.changed();
    return { ok: true };
  }

  /** Reçoit les ids dans le nouvel ordre. */
  async reorder(ids: number[]) {
    await this.db.transaction(async (tx) => {
      for (const [order, id] of ids.entries()) {
        await tx.update(projects).set({ order }).where(eq(projects.id, id));
      }
    });
    this.changed();
    return this.listAdmin();
  }

  async get(id: number) {
    const [row] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!row) throw new NotFoundException('Projet introuvable');
    return row;
  }

  // ─── Parties et galeries ──────────────────────────────────────────────────

  /** Les parties d'un projet, chacune avec ses photos dans l'ordre. */
  async listSections(projectId: number): Promise<SectionWithImages[]> {
    await this.get(projectId);
    return (await this.sectionsOf([projectId])).get(projectId) ?? [];
  }

  async createSection(projectId: number, dto: CreateSectionDto) {
    await this.get(projectId);
    const [{ max }] = await this.db
      .select({ max: sql<number>`coalesce(max(${projectSections.order}), -1)`.mapWith(Number) })
      .from(projectSections)
      .where(eq(projectSections.projectId, projectId));
    await this.db.insert(projectSections).values({ ...this.sectionPatch(dto), title: dto.title, projectId, order: max + 1 });
    return this.galleryChanged(projectId);
  }

  async updateSection(projectId: number, sectionId: number, dto: UpdateSectionDto) {
    await this.section(projectId, sectionId);
    await this.db.update(projectSections).set(this.sectionPatch(dto)).where(eq(projectSections.id, sectionId));
    return this.galleryChanged(projectId);
  }

  /** Supprime la partie et ses photos (fichiers compris). */
  async removeSection(projectId: number, sectionId: number) {
    await this.section(projectId, sectionId);
    const images = await this.db.select().from(projectImages).where(eq(projectImages.sectionId, sectionId));
    await this.db.delete(projectSections).where(eq(projectSections.id, sectionId));
    for (const img of images) await this.uploads.remove(img.publicId);
    return this.galleryChanged(projectId);
  }

  async reorderSections(projectId: number, ids: number[]) {
    await this.get(projectId);
    await this.db.transaction(async (tx) => {
      for (const [order, id] of ids.entries()) {
        await tx
          .update(projectSections)
          .set({ order })
          .where(and(eq(projectSections.id, id), eq(projectSections.projectId, projectId)));
      }
    });
    return this.galleryChanged(projectId);
  }

  /** Range dans une partie des photos déjà envoyées par /admin/uploads, à la suite des autres. */
  async addImages(projectId: number, sectionId: number, publicIds: string[]) {
    await this.section(projectId, sectionId);
    const unique = [...new Set(publicIds)];
    const already = await this.db.select({ publicId: projectImages.publicId }).from(projectImages).where(inArray(projectImages.publicId, unique));
    if (already.length) throw new BadRequestException('Une de ces photos est déjà dans une galerie');
    const files = [];
    for (const id of unique) files.push(await this.uploads.describeProjectImage(id));
    const [{ max }] = await this.db
      .select({ max: sql<number>`coalesce(max(${projectImages.order}), -1)`.mapWith(Number) })
      .from(projectImages)
      .where(eq(projectImages.sectionId, sectionId));
    await this.db.insert(projectImages).values(files.map((f, i) => ({ ...f, sectionId, order: max + 1 + i })));
    return this.galleryChanged(projectId);
  }

  async reorderImages(projectId: number, sectionId: number, ids: number[]) {
    await this.section(projectId, sectionId);
    await this.db.transaction(async (tx) => {
      for (const [order, id] of ids.entries()) {
        await tx
          .update(projectImages)
          .set({ order })
          .where(and(eq(projectImages.id, id), eq(projectImages.sectionId, sectionId)));
      }
    });
    return this.galleryChanged(projectId);
  }

  async removeImage(projectId: number, imageId: number) {
    const [img] = await this.db
      .select({ id: projectImages.id, publicId: projectImages.publicId })
      .from(projectImages)
      .innerJoin(projectSections, eq(projectSections.id, projectImages.sectionId))
      .where(and(eq(projectImages.id, imageId), eq(projectSections.projectId, projectId)))
      .limit(1);
    if (!img) throw new NotFoundException('Photo introuvable');
    await this.db.delete(projectImages).where(eq(projectImages.id, imageId));
    await this.uploads.remove(img.publicId);
    return this.galleryChanged(projectId);
  }

  // ─── Outils ───────────────────────────────────────────────────────────────

  /** Parties + photos de plusieurs projets en deux requêtes, rangées par projet. */
  private async sectionsOf(projectIds: number[]) {
    const byProject = new Map<number, SectionWithImages[]>();
    if (!projectIds.length) return byProject;
    const sections = await this.db
      .select()
      .from(projectSections)
      .where(inArray(projectSections.projectId, projectIds))
      .orderBy(asc(projectSections.order), asc(projectSections.id));
    const images = sections.length
      ? await this.db
          .select()
          .from(projectImages)
          .where(inArray(projectImages.sectionId, sections.map((s) => s.id)))
          .orderBy(asc(projectImages.order), asc(projectImages.id))
      : [];
    for (const s of sections) {
      const list = byProject.get(s.projectId) ?? [];
      list.push({ ...s, images: images.filter((i) => i.sectionId === s.id) });
      byProject.set(s.projectId, list);
    }
    return byProject;
  }

  private async section(projectId: number, sectionId: number) {
    const [row] = await this.db
      .select()
      .from(projectSections)
      .where(and(eq(projectSections.id, sectionId), eq(projectSections.projectId, projectId)))
      .limit(1);
    if (!row) throw new NotFoundException('Partie introuvable');
    return row;
  }

  private async galleryChanged(projectId: number) {
    await this.db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
    this.changed();
    return this.listSections(projectId);
  }

  private changed() {
    this.events.emit({ type: 'content.updated', what: 'projects' });
  }

  /** Ne garde que les champs envoyés : un champ absent n'est pas touché. */
  private patch(dto: UpdateProjectDto) {
    const patch: Partial<typeof projects.$inferInsert> = {};
    for (const key of FIELDS) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    return patch;
  }

  private sectionPatch(dto: UpdateSectionDto) {
    const patch: Partial<typeof projectSections.$inferInsert> = {};
    for (const key of SECTION_FIELDS) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    return patch;
  }

  private async lastOrder() {
    const [{ max }] = await this.db
      .select({ max: sql<number>`coalesce(max(${projects.order}), -1)`.mapWith(Number) })
      .from(projects);
    return max;
  }
}

/** Couverture : l'image choisie, sinon la 1re photo de la 1re partie qui en a. */
export function coverOf(imageUrl: string | null, sections: SectionWithImages[]): string | null {
  return imageUrl ?? sections.find((s) => s.images.length)?.images[0].url ?? null;
}
