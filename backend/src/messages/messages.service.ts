import { Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { messages } from '../db/schema';
import { EventsService } from '../events/events.service';
import { CreateMessageDto, MessageQuery } from './messages.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly events: EventsService,
  ) {}

  /** Formulaire de contact du site. L'admin connecté le voit arriver en direct (SSE). */
  async create(dto: CreateMessageDto) {
    const [row] = await this.db
      .insert(messages)
      .values({ name: dto.name, email: dto.email, phone: dto.phone ?? null, subject: dto.subject, message: dto.message })
      .returning();
    this.events.emit({ type: 'message.created', messageId: row.id, name: row.name, subject: row.subject });
    // Le site n'a pas besoin du contenu : un accusé de réception suffit.
    return { ok: true, id: row.id };
  }

  /** Du plus récent au plus ancien. ?filter=nonlus|lus&page=1&limit=50 */
  async list(query: MessageQuery = {}) {
    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const where = query.filter === 'nonlus' ? eq(messages.read, false) : query.filter === 'lus' ? eq(messages.read, true) : undefined;

    const [items, [{ n: total }], [{ n: unread }]] = await Promise.all([
      this.db
        .select()
        .from(messages)
        .where(where)
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ n: count() }).from(messages).where(where),
      this.db.select({ n: count() }).from(messages).where(eq(messages.read, false)),
    ]);
    return { items, total, unread, page, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async get(id: number) {
    const [row] = await this.db.select().from(messages).where(eq(messages.id, id)).limit(1);
    if (!row) throw new NotFoundException('Message introuvable');
    return row;
  }

  /** Marquer comme lu, ou remettre en non lu. */
  async setRead(id: number, read: boolean) {
    await this.get(id);
    const [row] = await this.db.update(messages).set({ read }).where(eq(messages.id, id)).returning();
    this.events.emit({ type: 'message.updated', messageId: id });
    return row;
  }

  /** Marque tous les messages comme lus (bouton « tout marquer comme lu »). */
  async readAll() {
    const rows = await this.db.update(messages).set({ read: true }).where(eq(messages.read, false)).returning({ id: messages.id });
    if (rows.length) this.events.emit({ type: 'message.updated', messageId: rows[0].id });
    return { ok: true, count: rows.length };
  }

  async remove(id: number) {
    await this.get(id);
    await this.db.delete(messages).where(eq(messages.id, id));
    this.events.emit({ type: 'message.deleted', messageId: id });
    return { ok: true };
  }

  /** Pour le tableau de bord : nombre de non lus + les derniers arrivés. */
  async summary(last = 5) {
    const [[{ n: total }], [{ n: unread }], recent] = await Promise.all([
      this.db.select({ n: count() }).from(messages),
      this.db
        .select({ n: sql<number>`count(*) filter (where not ${messages.read})`.mapWith(Number) })
        .from(messages),
      this.db
        .select({
          id: messages.id,
          name: messages.name,
          email: messages.email,
          phone: messages.phone,
          subject: messages.subject,
          read: messages.read,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(last),
    ]);
    return { total, unread, recent };
  }
}
