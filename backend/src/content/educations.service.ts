import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { EventsService } from '../events/events.service';
import { educations } from '../db/schema';
import { CreateEducationDto, UpdateEducationDto } from './content.dto';

/** Champs modifiables, traductions comprises. */
const FIELDS = [
  'degree', 'degreeEn', 'degreeEs', 'degreeAr',
  'institution', 'institutionEn', 'institutionEs', 'institutionAr',
  'period', 'periodEn', 'periodEs', 'periodAr',
  'description', 'descriptionEn', 'descriptionEs', 'descriptionAr',
  'current',
] as const;

@Injectable()
export class EducationsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly events: EventsService,
  ) {}

  async list() {
    return this.db.select().from(educations).orderBy(asc(educations.order), asc(educations.id));
  }

  async create(dto: CreateEducationDto) {
    const [row] = await this.db
      .insert(educations)
      .values({
        ...this.patch(dto),
        degree: dto.degree,
        institution: dto.institution,
        period: dto.period,
        current: dto.current ?? false,
        order: (await this.lastOrder()) + 1,
      })
      .returning();
    this.events.emit({ type: 'content.updated', what: 'educations' });
    return row;
  }

  async update(id: number, dto: UpdateEducationDto) {
    await this.get(id);
    const [row] = await this.db
      .update(educations)
      .set({ ...this.patch(dto), updatedAt: new Date() })
      .where(eq(educations.id, id))
      .returning();
    this.events.emit({ type: 'content.updated', what: 'educations' });
    return row;
  }

  async remove(id: number) {
    await this.get(id);
    await this.db.delete(educations).where(eq(educations.id, id));
    this.events.emit({ type: 'content.updated', what: 'educations' });
    return { ok: true };
  }

  /** Reçoit les ids dans le nouvel ordre. */
  async reorder(ids: number[]) {
    await this.db.transaction(async (tx) => {
      for (const [order, id] of ids.entries()) {
        await tx.update(educations).set({ order }).where(eq(educations.id, id));
      }
    });
    this.events.emit({ type: 'content.updated', what: 'educations' });
    return this.list();
  }

  async get(id: number) {
    const [row] = await this.db.select().from(educations).where(eq(educations.id, id)).limit(1);
    if (!row) throw new NotFoundException('Formation introuvable');
    return row;
  }

  /** Ne garde que les champs envoyés : un champ absent n'est pas touché. */
  private patch(dto: UpdateEducationDto) {
    const patch: Partial<typeof educations.$inferInsert> = {};
    for (const key of FIELDS) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    return patch;
  }

  private async lastOrder() {
    const [{ max }] = await this.db
      .select({ max: sql<number>`coalesce(max(${educations.order}), -1)`.mapWith(Number) })
      .from(educations);
    return max;
  }
}
