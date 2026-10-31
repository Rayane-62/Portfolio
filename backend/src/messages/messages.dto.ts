import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value);
const trimKeepLines = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Formulaire de contact du site : POST /public/contact */
export class CreateMessageDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Entre ton nom' })
  @MaxLength(120, { message: 'Le nom est trop long (120 caractères maximum)' })
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'E-mail invalide' })
  @MaxLength(160)
  email: string;

  /** Facultatif : beaucoup de client(e)s préfèrent être rappelé(e)s. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') || null : (value ?? null)))
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(30, { message: 'Numéro trop long (30 caractères maximum)' })
  phone?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Entre un objet' })
  @MaxLength(200, { message: "L'objet est trop long (200 caractères maximum)" })
  subject: string;

  @Transform(trimKeepLines)
  @IsString()
  @IsNotEmpty({ message: 'Écris ton message' })
  @MinLength(10, { message: 'Ton message est trop court (10 caractères minimum)' })
  @MaxLength(5000, { message: 'Ton message est trop long (5000 caractères maximum)' })
  message: string;
}

/** ?filter=nonlus&page=1&limit=50 */
export class MessageQuery {
  @IsOptional()
  @IsIn(['nonlus', 'lus'], { message: 'Filtre inconnu' })
  filter?: 'nonlus' | 'lus';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** { read: true } = marquer comme lu, { read: false } = remettre en non lu. */
export class ReadDto {
  @IsBoolean()
  read: boolean;
}
