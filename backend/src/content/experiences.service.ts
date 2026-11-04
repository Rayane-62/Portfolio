import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { EventsService } from '../events/events.service';
import { experiences } from '../db/schema';
import { CreateExperienceDto, UpdateExperienceDto } from './content.dto';

/** Champs modifiables, traductions comprises. */
const FIELDS = [
  'position', 'positionEn', 'positionEs', 'positionAr',
  'company', 'companyEn', 'companyEs', 'companyAr',
  'period', 'periodEn', 'periodEs', 'periodAr',
  'description', 'descriptionEn', 'descriptionEs', 'descriptionAr',
  'technologies', 'current',
] as const;

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly events: EventsService,
  ) {}

  /** Du poste le plus récent au plus ancien, selon l'ordre choisi dans l'admin. */
  async list() {
    return this.db.select().from(experiences).orderBy(asc(experiences.order), asc(experiences.id));
  }

  async create(dto: CreateExperienceDto) {
    const [row] = await this.db
      .insert(experiences)
      .values({
        ...this.patch(dto),
        position: dto.position,
        company: dto.company,
        period: dto.period,
        description: dto.description ?? '',
        technologies: dto.technologies ?? [],
        current: dto.current ?? false,
        order: (await this.lastOrder()) + 1,
      })
      .returning();
    this.events.emit({ type: 'content.updated', what: 'experiences' });
    return row;
  }

  async update(id: number, dto: UpdateExperienceDto) {
    await this.get(id);
    const [row] = await this.db
      .update(experiences)
      .set({ ...this.patch(dto), updatedAt: new Date() })
      .where(eq(experiences.id, id))
      .returning();
    this.events.emit({ type: 'content.updated', what: 'experiences' });
    return row;
  }

  async remove(id: number) {
    await this.get(id);
    await this.db.delete(experiences).where(eq(experiences.id, id));
    this.events.emit({ type: 'content.updated', what: 'experiences' });
    return { ok: true };
  }

  /** Reçoit les ids dans le nouvel ordre. */
  async reorder(ids: number[]) {
    await this.db.transaction(async (tx) => {
      for (const [order, id] of ids.entries()) {
        await tx.update(experiences).set({ order }).where(eq(experiences.id, id));
      }
    });
    this.events.emit({ type: 'content.updated', what: 'experiences' });
    return this.list();
  }

  async get(id: number) {
    const [row] = await this.db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
    if (!row) throw new NotFoundException('Expérience introuvable');
    return row;
  }

  /** Ne garde que les champs envoyés : un champ absent n'est pas touché. */
  private patch(dto: UpdateExperienceDto) {
    const patch: Partial<typeof experiences.$inferInsert> = {};
    for (const key of FIELDS) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    return patch;
  }

  private async lastOrder() {
    const [{ max }] = await this.db
      .select({ max: sql<number>`coalesce(max(${experiences.order}), -1)`.mapWith(Number) })
      .from(experiences);
    return max;
  }
}
