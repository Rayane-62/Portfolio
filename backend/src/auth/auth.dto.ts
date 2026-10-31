import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value);

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "Entre ton identifiant" })
  @MaxLength(160)
  login: string;

  @IsString()
  @IsNotEmpty({ message: 'Entre ton mot de passe' })
  @MaxLength(200)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Entre ton mot de passe actuel' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit faire au moins 8 caractères' })
  @MaxLength(200)
  newPassword: string;
}

/** « Mon compte » : prénom, nom et identifiant de connexion. */
export class UpdateProfileDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @MaxLength(60)
  firstName: string;

  @Transform(trim)
  @IsString()
  @MaxLength(60)
  lastName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: "L'identifiant est obligatoire" })
  @MinLength(3, { message: "L'identifiant doit faire au moins 3 caractères" })
  @MaxLength(160)
  @Matches(/^[^\s]+$/, { message: "L'identifiant ne doit pas contenir d'espace" })
  login: string;
}
