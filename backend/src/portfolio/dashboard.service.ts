import { Injectable } from '@nestjs/common';
import { count, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { educations, experiences, projects, skills } from '../db/schema';
import { MessagesService } from '../messages/messages.service';
import { InfoService } from './info.service';

/** L'accueil de l'admin : ce qu'il y a dans le portfolio et les derniers messages. */
@Injectable()
export class DashboardService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly info: InfoService,
    private readonly messages: MessagesService,
  ) {}

  async get() {
    const [[projectCounts], [{ n: skillCount }], [{ n: experienceCount }], [{ n: educationCount }], msgs, i] = await Promise.all([
      this.db
        .select({
          total: count(),
          visible: sql<number>`count(*) filter (where ${projects.visible})`.mapWith(Number),
          hidden: sql<number>`count(*) filter (where not ${projects.visible})`.mapWith(Number),
          featured: sql<number>`count(*) filter (where ${projects.featured})`.mapWith(Number),
        })
        .from(projects),
      this.db.select({ n: count() }).from(skills),
      this.db.select({ n: count() }).from(experiences),
      this.db.select({ n: count() }).from(educations),
      this.messages.summary(5),
      this.info.get(),
    ]);

    return {
      counts: {
        projects: projectCounts.total,
        projectsVisible: projectCounts.visible,
        projectsHidden: projectCounts.hidden,
        projectsFeatured: projectCounts.featured,
        skills: skillCount,
        experiences: experienceCount,
        educations: educationCount,
        messages: msgs.total,
        unreadMessages: msgs.unread,
      },
      /** Les 5 derniers messages reçus, du plus récent au plus ancien. */
      lastMessages: msgs.recent,
      /** Petits rappels : ce qui manque encore pour que le site soit complet. */
      todo: {
        photo: !i.photoUrl,
        cv: !i.cvUrl,
        projects: projectCounts.visible === 0,
        bio: !i.bio.trim(),
      },
      available: i.available,
    };
  }
}
