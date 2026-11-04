import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { InjectDb } from '../db/db.module';
import { admins } from '../db/schema';
import { passwordVersion } from './admin-auth.guard';
import type { AuthAdmin } from './auth.decorators';

export const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async login(login: string, password: string) {
    const [admin] = await this.db
      .select()
      .from(admins)
      .where(eq(sql`lower(${admins.login})`, login.trim().toLowerCase()))
      .limit(1);

    // Même message dans les deux cas pour ne pas révéler si l'identifiant existe.
    const ok = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
    if (!admin || !ok) throw new UnauthorizedException('Identifiant ou mot de passe incorrect');

    const token = await this.jwt.signAsync({ sub: admin.id, pv: passwordVersion(admin.passwordHash) });
    return {
      token,
      admin: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        login: admin.login,
        mustChangePassword: admin.mustChangePassword,
      } satisfies AuthAdmin,
    };
  }

  /** « Mon compte » : prénom, nom et identifiant de connexion. */
  async updateProfile(me: AuthAdmin, firstName: string, lastName: string, login: string) {
    await this.db.update(admins).set({ firstName, lastName, login, updatedAt: new Date() }).where(eq(admins.id, me.id));
    return { ...me, firstName, lastName, login } satisfies AuthAdmin;
  }

  /** Renvoie un nouveau jeton : les autres appareils, eux, sont déconnectés. */
  async changePassword(adminId: number, currentPassword: string, newPassword: string) {
    const [admin] = await this.db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    if (!admin) throw new UnauthorizedException();
    if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      throw new BadRequestException('Le mot de passe actuel est incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException("Choisis un mot de passe différent de l'actuel");
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.db
      .update(admins)
      .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(admins.id, adminId));
    const token = await this.jwt.signAsync({ sub: admin.id, pv: passwordVersion(passwordHash) });
    return { ok: true, token };
  }
}
