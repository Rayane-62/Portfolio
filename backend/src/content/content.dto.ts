import { applyDecorators } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  projectCategory,
  ProjectCategory,
  projectContext,
  ProjectContext,
  projectStatus,
  ProjectStatus,
  PLATFORMS,
  type Platform,
  skillCategory,
  SkillCategory,
} from '../db/schema';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value);
const trimKeepLines = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? null : typeof value === 'string' ? value.trim() : value;

/**
 * Une traduction (anglais, espagnol, arabe) : toujours facultative.
 * Vide = NULL : l'API renvoie alors le français à sa place.
 */
function Traduction(max: number) {
  return applyDecorators(IsOptional(), Transform(emptyToNull), ValidateIf((_, v) => v !== null), IsString(), MaxLength(max));
}

/** Liste de technologies : ['React', 'NestJS', …]. Les cases vides sont retirées. */
function Technologies() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => (Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : value)),
    IsArray(),
    ArrayMaxSize(30, { message: '30 technologies maximum' }),
    IsString({ each: true }),
    MaxLength(40, { each: true, message: '40 caractères maximum par technologie' }),
  );
}

/** Lien facultatif (site en ligne, dépôt GitHub). Vide = pas de bouton sur le site. */
function Lien(message: string) {
  return applyDecorators(
    IsOptional(),
    Transform(emptyToNull),
    ValidateIf((_, v) => v !== null),
    Matches(/^https?:\/\//, { message }),
    MaxLength(1000),
  );
}

// ─── Commun ─────────────────────────────────────────────────────────────────

/** Nouvel ordre d'affichage : { ids: [3, 1, 2, …] } */
export class ReorderDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  ids: number[];
}

export class VisibleDto {
  @IsBoolean()
  visible: boolean;
}

// ─── Compétences ────────────────────────────────────────────────────────────

export class CreateSkillDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Donne un nom à la compétence' })
  @MaxLength(80)
  name: string;

  /** En général une URL du CDN devicon. Vide = pas de logo. */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined || value === null ? '' : String(value).trim()))
  @ValidateIf((_, v) => v !== '')
  @Matches(/^https?:\/\//, { message: 'Logo invalide : donne une adresse qui commence par https://' })
  @MaxLength(1000)
  iconUrl?: string;

  @IsIn(skillCategory.enumValues, { message: 'Catégorie inconnue : frontend, backend, mobile ou tools' })
  category: SkillCategory;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

// ─── Parcours professionnel ─────────────────────────────────────────────────

export class CreateExperienceDto {
  /** L'intitulé du poste (« Développeur Web »). */
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Indique le poste' })
  @MaxLength(160)
  position: string;

  @Traduction(160) positionEn?: string | null;
  @Traduction(160) positionEs?: string | null;
  @Traduction(160) positionAr?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: "Indique l'entreprise" })
  @MaxLength(160)
  company: string;

  @Traduction(160) companyEn?: string | null;
  @Traduction(160) companyEs?: string | null;
  @Traduction(160) companyAr?: string | null;

  /** Dates écrites librement : « Juin 2025 → Présent ». */
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Indique la période' })
  @MaxLength(120)
  period: string;

  @Traduction(120) periodEn?: string | null;
  @Traduction(120) periodEs?: string | null;
  @Traduction(120) periodAr?: string | null;

  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Traduction(2000) descriptionEn?: string | null;
  @Traduction(2000) descriptionEs?: string | null;
  @Traduction(2000) descriptionAr?: string | null;

  @Technologies() technologies?: string[];

  /** true = poste en cours (badge « Actuel »). */
  @IsOptional()
  @IsBoolean()
  current?: boolean;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

// ─── Formation ──────────────────────────────────────────────────────────────

export class CreateEducationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Indique le diplôme' })
  @MaxLength(200)
  degree: string;

  @Traduction(200) degreeEn?: string | null;
  @Traduction(200) degreeEs?: string | null;
  @Traduction(200) degreeAr?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: "Indique l'établissement" })
  @MaxLength(200)
  institution: string;

  @Traduction(200) institutionEn?: string | null;
  @Traduction(200) institutionEs?: string | null;
  @Traduction(200) institutionAr?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Indique la période' })
  @MaxLength(120)
  period: string;

  @Traduction(120) periodEn?: string | null;
  @Traduction(120) periodEs?: string | null;
  @Traduction(120) periodAr?: string | null;

  /** Facultative : vide = rien sous le diplôme. */
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @Traduction(2000) descriptionEn?: string | null;
  @Traduction(2000) descriptionEs?: string | null;
  @Traduction(2000) descriptionAr?: string | null;

  /** true = diplôme en cours (badge « En cours »). */
  @IsOptional()
  @IsBoolean()
  current?: boolean;
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}

// ─── Projets ────────────────────────────────────────────────────────────────

export class CreateProjectDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Donne un titre au projet' })
  @MaxLength(160)
  title: string;

  @Traduction(160) titleEn?: string | null;
  @Traduction(160) titleEs?: string | null;
  @Traduction(160) titleAr?: string | null;

  /** Une ou deux phrases pour la carte. */
  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(400)
  summary?: string;

  @Traduction(400) summaryEn?: string | null;
  @Traduction(400) summaryEs?: string | null;
  @Traduction(400) summaryAr?: string | null;

  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(6000)
  description?: string;

  @Traduction(6000) descriptionEn?: string | null;
  @Traduction(6000) descriptionEs?: string | null;
  @Traduction(6000) descriptionAr?: string | null;

  /** Fonctionnalités clés, une par ligne. */
  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(4000)
  features?: string;

  @Traduction(4000) featuresEn?: string | null;
  @Traduction(4000) featuresEs?: string | null;
  @Traduction(4000) featuresAr?: string | null;

  /** Points forts techniques, un par ligne. */
  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(4000)
  highlights?: string;

  @Traduction(4000) highlightsEn?: string | null;
  @Traduction(4000) highlightsEs?: string | null;
  @Traduction(4000) highlightsAr?: string | null;

  /** Au moins une : ['web'], ['web', 'mobile']… */
  @IsArray({ message: 'Choisis au moins une catégorie' })
  @ArrayMinSize(1, { message: 'Choisis au moins une catégorie' })
  @ArrayUnique()
  @IsIn(projectCategory.enumValues, { each: true, message: 'Catégorie inconnue : web, mobile ou desktop' })
  categories: ProjectCategory[];

  @IsOptional()
  @IsIn(projectStatus.enumValues, { message: 'Statut inconnu' })
  status?: ProjectStatus;

  /** NULL = non précisé. */
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsIn(projectContext.enumValues, { message: 'Contexte inconnu' })
  context?: ProjectContext | null;

  @IsOptional()
  @IsBoolean()
  team?: boolean;

  /** true = les parties sont des sous-projets complets. */
  @IsOptional()
  @IsBoolean()
  hasSubprojects?: boolean;

  @Technologies() technologies?: string[];

  @Lien('Image invalide') imageUrl?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(300)
  imagePublicId?: string | null;

  @Lien('Le lien du projet doit commencer par https://') liveUrl?: string | null;
  @Lien('Le lien GitHub doit commencer par https://') githubUrl?: string | null;

  /** Mis en avant en haut de la section « Projets ». */
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  /** false = gardé dans l'admin mais masqué sur le site. */
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

/** Une partie du projet : « Site admin », « App livreurs »… */
export class CreateSectionDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Donne un nom à cette partie' })
  @MaxLength(120)
  title: string;

  @Traduction(120) titleEn?: string | null;
  @Traduction(120) titleEs?: string | null;
  @Traduction(120) titleAr?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  subtitle?: string | null;

  @Traduction(200) subtitleEn?: string | null;
  @Traduction(200) subtitleEs?: string | null;
  @Traduction(200) subtitleAr?: string | null;

  // ─── Sous-projet (projet avec sous-projets) ───

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(6000)
  description?: string | null;

  @Traduction(6000) descriptionEn?: string | null;
  @Traduction(6000) descriptionEs?: string | null;
  @Traduction(6000) descriptionAr?: string | null;

  /** Une fonctionnalité par ligne. */
  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(4000)
  features?: string;

  @Traduction(4000) featuresEn?: string | null;
  @Traduction(4000) featuresEs?: string | null;
  @Traduction(4000) featuresAr?: string | null;

  /** ['web', 'android', 'ios', 'desktop'] */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PLATFORMS, { each: true, message: 'Plateforme inconnue : web, android, ios ou desktop' })
  platforms?: Platform[];

  @Technologies() technologies?: string[];

  @Lien('Le lien du sous-projet doit commencer par https://') liveUrl?: string | null;
  @Lien('Le lien GitHub doit commencer par https://') githubUrl?: string | null;
}

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}

/** Photos déjà envoyées par /admin/uploads, à ranger dans une partie : { publicIds: ['local:project-….webp'] } */
export class AddImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100, { message: '100 photos maximum par envoi' })
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  publicIds: string[];
}

/** ?category=web&filter=visible|masque|featured */
export class AdminProjectQuery {
  @IsOptional()
  @IsIn(projectCategory.enumValues, { message: 'Catégorie inconnue' })
  category?: ProjectCategory;

  @IsOptional()
  @IsIn(['visible', 'masque', 'featured'], { message: 'Filtre inconnu' })
  filter?: 'visible' | 'masque' | 'featured';
}

/** Utilisé par les routes publiques : ?locale=fr|en|es|ar */
export class LocaleQuery {
  @IsOptional()
  @Type(() => String)
  @IsString()
  locale?: string;
}
