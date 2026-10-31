import { Injectable } from '@nestjs/common';
import { type Locale, tr } from '../common/locale';
import { socialUrl, waNumber } from '../common/text';
import { skillCategory, SOCIAL_KEYS, type SocialKey } from '../db/schema';
import { EducationsService } from '../content/educations.service';
import { ExperiencesService } from '../content/experiences.service';
import { ProjectsService } from '../content/projects.service';
import { SkillsService } from '../content/skills.service';
import { InfoService } from './info.service';

/** Tout ce dont le site a besoin pour s'afficher, dans la langue demandée. */
@Injectable()
export class PortfolioService {
  constructor(
    private readonly info: InfoService,
    private readonly skills: SkillsService,
    private readonly experiences: ExperiencesService,
    private readonly educations: EducationsService,
    private readonly projects: ProjectsService,
  ) {}

  async get(locale: Locale) {
    const [i, skillRows, expRows, eduRows, projectRows] = await Promise.all([
      this.info.get(),
      this.skills.list(),
      this.experiences.list(),
      this.educations.list(),
      this.projects.listPublic(),
    ]);

    // Réseaux : lien complet prêt pour un href, ou NULL quand le champ est vide.
    const socials = Object.fromEntries(SOCIAL_KEYS.map((k) => [k, socialUrl(k, i[k])])) as Record<SocialKey, string | null>;

    // Compétences rangées dans les 4 colonnes du site ; une catégorie vide reste un tableau vide.
    const skills = Object.fromEntries(
      skillCategory.enumValues.map((cat) => [
        cat,
        skillRows.filter((s) => s.category === cat).map((s) => ({ id: s.id, name: s.name, iconUrl: s.iconUrl || null })),
      ]),
    );

    return {
      locale,
      info: {
        // Sur la version arabe, le nom en arabe s'il existe ; sinon le nom latin.
        name: (locale === 'ar' ? i.nameAr?.trim() || i.name : i.name) || null,
        nameLatin: i.name || null,
        title: tr(i, 'title', locale),
        bio: tr(i, 'bio', locale),
        photoUrl: i.photoUrl,
        cvUrl: i.cvUrl,
        email: i.email || null,
        phone: i.phone || null,
        whatsapp: i.whatsapp || null,
        whatsappLink: i.whatsapp ? `https://wa.me/${waNumber(i.whatsapp)}` : null,
        available: i.available,
        stats: { projects: i.statsProjects, experience: i.statsExperience, clients: i.statsClients },
        socials,
      },
      skills,
      experiences: expRows.map((e) => ({
        id: e.id,
        position: tr(e, 'position', locale),
        company: tr(e, 'company', locale),
        period: tr(e, 'period', locale),
        description: tr(e, 'description', locale),
        technologies: e.technologies,
        current: e.current,
      })),
      educations: eduRows.map((e) => ({
        id: e.id,
        degree: tr(e, 'degree', locale),
        institution: tr(e, 'institution', locale),
        period: tr(e, 'period', locale),
        description: tr(e, 'description', locale),
        current: e.current,
      })),
      projects: projectRows.map((p) => ({
        id: p.id,
        title: tr(p, 'title', locale),
        description: tr(p, 'description', locale),
        category: p.category,
        technologies: p.technologies,
        imageUrl: p.imageUrl,
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
        featured: p.featured,
      })),
    };
  }
}
