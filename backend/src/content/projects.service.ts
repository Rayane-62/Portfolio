import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { EventsService } from '../events/events.service';
import { projects } from '../db/schema';
import { UploadsService } from '../uploads/uploads.service';
import { AdminProjectQuery, CreateProjectDto, UpdateProjectDto } from './content.dto';

/** Champs modifiables, traductions comprises. */
const FIELDS = [
  'title', 'titleEn', 'titleEs', 'titleAr',
  'description', 'descriptionEn', 'descriptionEs', 'descriptionAr',
  'category', 'technologies', 'imageUrl', 'imagePublicId', 'liveUrl', 'githubUrl', 'featured', 'visible',
] as const;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly uploads: UploadsService,
    private readonly events: EventsService,
  ) {}

  /** Liste de l'admin : tout, masqués compris. ?category=&filter=visible|masque|featured */
  async listAdmin(query: AdminProjectQuery = {}) {
    const where: SQL[] = [];
    if (query.category) where.push(eq(projects.category, query.category));
    if (query.filter === 'visible') where.push(eq(projects.visible, true));
    if (query.filter === 'masque') where.push(eq(projects.visible, false));
    if (query.filter === 'featured') where.push(eq(projects.featured, true));
    return this.db
      .select()
      .from(projects)
      .where(where.length ? and(...where) : undefined)
      .orderBy(asc(projects.order), desc(projects.id));
  }

  /** Liste du site : seulement les projets affichés, les mis en avant d'abord. */
  async listPublic() {
    return this.db
      .select()
      .from(projects)
      .where(eq(projects.visible, true))
      .orderBy(desc(projects.featured), asc(projects.order), asc(projects.id));
  }

  async create(dto: CreateProjectDto) {
    const [row] = await this.db
      .insert(projects)
      .values({
        ...this.patch(dto),
        title: dto.title,
        description: dto.description ?? '',
        category: dto.category,
        technologies: dto.technologies ?? [],
        order: (await this.lastOrder()) + 1,
      })
      .returning();
    this.events.emit({ type: 'content.updated', what: 'projects' });
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
    this.events.emit({ type: 'content.updated', what: 'projects' });
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
    this.events.emit({ type: 'content.updated', what: 'projects' });
    return row;
  }

  async remove(id: number) {
    const current = await this.get(id);
    await this.db.delete(projects).where(eq(projects.id, id));
    await this.uploads.remove(current.imagePublicId);
    this.events.emit({ type: 'content.updated', what: 'projects' });
    return { ok: true };
  }

  /** Reçoit les ids dans le nouvel ordre. */
  async reorder(ids: number[]) {
    await this.db.transaction(async (tx) => {
      for (const [order, id] of ids.entries()) {
        await tx.update(projects).set({ order }).where(eq(projects.id, id));
      }
    });
    this.events.emit({ type: 'content.updated', what: 'projects' });
    return this.listAdmin();
  }

  async get(id: number) {
    const [row] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!row) throw new NotFoundException('Projet introuvable');
    return row;
  }

  /** Ne garde que les champs envoyés : un champ absent n'est pas touché. */
  private patch(dto: UpdateProjectDto) {
    const patch: Partial<typeof projects.$inferInsert> = {};
    for (const key of FIELDS) {
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
