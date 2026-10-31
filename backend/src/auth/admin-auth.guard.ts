import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { admins } from '../db/schema';
import type { AuthAdmin } from './auth.decorators';

/**
 * Protège toutes les routes /api/admin/*.
 * Le compte est relu en base à chaque requête : un mot de passe changé ailleurs
 * (champ updatedAt) invalide les anciennes sessions.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectDb() private readonly db: Database,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Connexion requise');

    let payload: { sub: number; pv?: number };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Session expirée, reconnecte-toi');
    }

    const [admin] = await this.db.select().from(admins).where(eq(admins.id, payload.sub)).limit(1);
    if (!admin) throw new UnauthorizedException('Compte introuvable');
    // « pv » = version du mot de passe : après un changement, les autres appareils sont déconnectés.
    if (payload.pv !== undefined && payload.pv !== passwordVersion(admin.passwordHash)) {
      throw new UnauthorizedException('Mot de passe changé : reconnecte-toi');
    }

    req.admin = {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      login: admin.login,
      mustChangePassword: admin.mustChangePassword,
    } satisfies AuthAdmin;
    return true;
  }
}

/** Petit nombre dérivé du hash : change à chaque nouveau mot de passe. */
export function passwordVersion(hash: string): number {
  let h = 0;
  for (let i = 0; i < hash.length; i++) h = (h * 31 + hash.charCodeAt(i)) | 0;
  return h;
}
