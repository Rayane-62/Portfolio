import { Injectable } from '@nestjs/common';
import { type Locale, tr } from '../common/locale';
import { socialUrl, waNumber } from '../common/text';
import { skillCategory, SOCIAL_KEYS, type SocialKey } from '../db/schema';
import { EducationsService } from '../content/educations.service';
import { ExperiencesService } from '../content/experiences.service';
import { coverOf, ProjectsService } from '../content/projects.service';
import { SkillsService } from '../content/skills.service';
import { InfoService } from './info.service';

/** « - Une ligne⏎• Une autre » → ['Une ligne', 'Une autre'] */
function lines(text: string | null): string[] {
  return (text ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

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
      projects: projectRows.map((p) => {
        const description = tr(p, 'description', locale);
        return {
          id: p.id,
          title: tr(p, 'title', locale),
          // Pas de résumé : la carte reprend le 1er paragraphe de la description.
          summary: tr(p, 'summary', locale) ?? description?.split(/\n\s*\n/)[0] ?? null,
          description,
          features: lines(tr(p, 'features', locale)),
          highlights: lines(tr(p, 'highlights', locale)),
          categories: p.categories,
          status: p.status,
          context: p.context,
          team: p.team,
          hasSubprojects: p.hasSubprojects,
          technologies: p.technologies,
          coverUrl: coverOf(p.imageUrl, p.sections),
          liveUrl: p.liveUrl,
          playStoreUrl: p.playStoreUrl,
          appStoreUrl: p.appStoreUrl,
          downloadUrl: p.downloadUrl,
          repos: p.repos,
          featured: p.featured,
          // Galerie simple : seules les parties avec photos ont un onglet. Sous-projets : tous sont affichés.
          sections: p.sections
            .filter((s) => p.hasSubprojects || s.images.length)
            .map((s) => {
              const subDescription = tr(s, 'description', locale);
              return {
              id: s.id,
              title: tr(s, 'title', locale),
              subtitle: tr(s, 'subtitle', locale),
              summary: tr(s, 'summary', locale) ?? subDescription?.split(/\n\s*\n/)[0] ?? null,
              status: s.status,
              description: subDescription,
              features: lines(tr(s, 'features', locale)),
              highlights: lines(tr(s, 'highlights', locale)),
              kind: s.kind,
              technologies: s.technologies,
              liveUrl: s.liveUrl,
              playStoreUrl: s.playStoreUrl,
              appStoreUrl: s.appStoreUrl,
              downloadUrl: s.downloadUrl,
              repos: s.repos,
              images: s.images.map((img) => ({ id: img.id, url: img.url, width: img.width, height: img.height })),
              };
            }),
          // Les parties sans photo restent listées dans « Parties du projet ».
          parts: p.sections.map((s) => ({ title: tr(s, 'title', locale), subtitle: tr(s, 'subtitle', locale) })),
        };
      }),
    };
  }
}
