import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { cleanHandle } from '../common/text';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { info, SOCIAL_KEYS } from '../db/schema';
import { EventsService } from '../events/events.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateInfoDto } from './info.dto';

/** Les champs texte modifiables, traductions comprises. */
const FIELDS = [
  'name', 'nameAr',
  'title', 'titleEn', 'titleEs', 'titleAr',
  'bio', 'bioEn', 'bioEs', 'bioAr',
  'photoUrl', 'photoPublicId', 'cvUrl', 'cvPublicId',
  'email', 'phone', 'whatsapp', 'available',
  'statsProjects', 'statsExperience', 'statsClients',
] as const;

@Injectable()
export class InfoService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly uploads: UploadsService,
    private readonly events: EventsService,
  ) {}

  /** La ligne d'informations est créée automatiquement si elle n'existe pas. */
  async get() {
    const [row] = await this.db.select().from(info).where(eq(info.id, 1)).limit(1);
    if (row) return row;
    const [created] = await this.db.insert(info).values({ id: 1 }).onConflictDoNothing().returning();
    return created ?? (await this.db.select().from(info).where(eq(info.id, 1)))[0];
  }

  async update(dto: UpdateInfoDto) {
    const current = await this.get();
    const patch: Partial<typeof info.$inferInsert> = { updatedAt: new Date() };
    for (const key of FIELDS) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    // Les réseaux sont nettoyés : un lien collé devient un pseudo, vide devient NULL.
    for (const key of SOCIAL_KEYS) {
      if (dto[key] !== undefined) patch[key] = cleanHandle(dto[key], key);
    }

    const [row] = await this.db.update(info).set(patch).where(eq(info.id, 1)).returning();
    // Photo ou CV remplacé : l'ancien fichier ne sert plus à rien.
    if (dto.photoPublicId !== undefined && current.photoPublicId && current.photoPublicId !== dto.photoPublicId) {
      await this.uploads.remove(current.photoPublicId);
    }
    if (dto.cvPublicId !== undefined && current.cvPublicId && current.cvPublicId !== dto.cvPublicId) {
      await this.uploads.remove(current.cvPublicId);
    }
    this.events.emit({ type: 'content.updated', what: 'info' });
    return row;
  }
}
