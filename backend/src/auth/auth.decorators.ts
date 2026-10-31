import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Ce que le garde attache à la requête après vérification du jeton. */
export interface AuthAdmin {
  id: number;
  firstName: string;
  lastName: string;
  login: string;
  mustChangePassword: boolean;
}

/** Récupère l'admin connecté dans un contrôleur : @CurrentAdmin() me: AuthAdmin */
export const CurrentAdmin = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthAdmin => {
  return ctx.switchToHttp().getRequest().admin;
});
