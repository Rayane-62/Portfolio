import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value);
const trimKeepLines = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? null : typeof value === 'string' ? value.trim() : value;

/** Une traduction : toujours facultative. Vide = NULL, l'API renvoie le français à sa place. */
function Traduction(max: number) {
  return applyDecorators(IsOptional(), Transform(emptyToNull), ValidateIf((_, v) => v !== null), IsString(), MaxLength(max));
}

/**
 * Un réseau social : facultatif, vide = NULL = le bouton ne s'affiche pas sur le site.
 * Accepte le pseudo (« Rayane-62 »), l'@ ou le lien complet : l'API garde le pseudo seul.
 */
function Reseau() {
  return applyDecorators(IsOptional(), Transform(emptyToNull), ValidateIf((_, v) => v !== null), IsString(), MaxLength(200));
}

/** Un compteur de la section « chiffres » (projets, années, clients). */
function Statistique(label: string) {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsInt({ message: `${label} : indique un nombre entier` }),
    Min(0, { message: `${label} : le nombre ne peut pas être négatif` }),
    Max(9999),
  );
}

/** PATCH /admin/info : tous les champs sont facultatifs, seuls ceux envoyés sont modifiés. */
export class UpdateInfoDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(120)
  name?: string;

  /** Nom écrit en arabe, affiché seulement sur la version arabe du site. */
  @Traduction(120) nameAr?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(160)
  title?: string;

  @Traduction(160) titleEn?: string | null;
  @Traduction(160) titleEs?: string | null;
  @Traduction(160) titleAr?: string | null;

  @IsOptional()
  @Transform(trimKeepLines)
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @Traduction(4000) bioEn?: string | null;
  @Traduction(4000) bioEs?: string | null;
  @Traduction(4000) bioAr?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @Matches(/^https?:\/\//, { message: 'Photo invalide' })
  @MaxLength(1000)
  photoUrl?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(300)
  photoPublicId?: string | null;

  /** Le CV en PDF, envoyé par /admin/uploads?kind=cv. */
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @Matches(/^https?:\/\//, { message: 'CV invalide' })
  @MaxLength(1000)
  cvUrl?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(300)
  cvPublicId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined || value === null ? '' : String(value).trim()))
  @ValidateIf((_, v) => v !== '')
  @IsEmail({}, { message: 'E-mail invalide' })
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  /** false = « pas disponible en ce moment » sur le site. */
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @Statistique('Projets') statsProjects?: number;
  @Statistique("Années d'expérience") statsExperience?: number;
  @Statistique('Clients') statsClients?: number;

  @Reseau() github?: string | null;
  @Reseau() linkedin?: string | null;
  @Reseau() instagram?: string | null;
  @Reseau() facebook?: string | null;
  @Reseau() x?: string | null;
  @Reseau() youtube?: string | null;
  @Reseau() tiktok?: string | null;
}
