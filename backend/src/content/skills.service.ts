import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { EventsService } from '../events/events.service';
import { skills } from '../db/schema';
import { CreateSkillDto, UpdateSkillDto } from './content.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly events: EventsService,
  ) {}

  /** Toutes les compétences dans l'ordre d'affichage. */
  async list() {
    return this.db.select().from(skills).orderBy(asc(skills.position), asc(skills.id));
  }

  async create(dto: CreateSkillDto) {
    await this.assertNameFree(dto.name);
    const [row] = await this.db
      .insert(skills)
      .values({
        name: dto.name,
        iconUrl: dto.iconUrl ?? '',
        category: dto.category,
        position: (await this.lastPosition()) + 1,
      })
      .returning();
    this.events.emit({ type: 'content.updated', what: 'skills' });
    return row;
  }

  async update(id: number, dto: UpdateSkillDto) {
    await this.get(id);
    if (dto.name !== undefined) await this.assertNameFree(dto.name, id);
    const patch: Partial<typeof skills.$inferInsert> = {};
    for (const key of ['name', 'iconUrl', 'category'] as const) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    const [row] = await this.db.update(skills).set(patch).where(eq(skills.id, id)).returning();
    this.events.emit({ type: 'content.updated', what: 'skills' });
    return row;
  }

  async remove(id: number) {
    await this.get(id);
    await this.db.delete(skills).where(eq(skills.id, id));
    this.events.emit({ type: 'content.updated', what: 'skills' });
    return { ok: true };
  }

  /** Reçoit les ids dans le nouvel ordre. */
  async reorder(ids: number[]) {
    await this.db.transaction(async (tx) => {
      for (const [position, id] of ids.entries()) {
        await tx.update(skills).set({ position }).where(eq(skills.id, id));
      }
    });
    this.events.emit({ type: 'content.updated', what: 'skills' });
    return this.list();
  }

  async get(id: number) {
    const [row] = await this.db.select().from(skills).where(eq(skills.id, id)).limit(1);
    if (!row) throw new NotFoundException('Compétence introuvable');
    return row;
  }

  private async lastPosition() {
    const [{ max }] = await this.db
      .select({ max: sql<number>`coalesce(max(${skills.position}), -1)`.mapWith(Number) })
      .from(skills);
    return max;
  }

  private async assertNameFree(name: string, exceptId?: number) {
    const [row] = await this.db
      .select({ id: skills.id })
      .from(skills)
      .where(eq(sql`lower(${skills.name})`, name.toLowerCase()))
      .limit(1);
    if (row && row.id !== exceptId) throw new ConflictException('Cette compétence existe déjà');
  }
}
