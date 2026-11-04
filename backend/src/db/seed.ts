/**
 * Données de départ : le strict minimum pour pouvoir se connecter à l'admin.
 * Le script peut être relancé sans risque : il ne crée que ce qui manque.
 *
 *   npm run db:seed        → la ligne d'informations (vide) + le compte admin
 *   npm run db:seed:demo   → pareil, puis le contenu réel repris de Strapi (npm run db:import)
 *
 * Les projets, eux, ne sont jamais créés par le seed : le propriétaire ajoute les siens
 * depuis l'admin.
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { count } from 'drizzle-orm';
import { createDb, createPool } from './client';
import { admins, info } from './schema';

async function main() {
  const pool = createPool();
  const db = createDb(pool);

  // 1. Informations personnelles (une seule ligne, id = 1)
  await db.insert(info).values({ id: 1 }).onConflictDoNothing();
  console.log('✓ Ligne « informations » prête (à remplir dans l\'admin, ou avec npm run db:import)');

  // 2. Compte admin (un seul)
  const [{ n: adminCount }] = await db.select({ n: count() }).from(admins);
  if (adminCount === 0) {
    const login = process.env.SEED_ADMIN_LOGIN || 'admin';
    const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMoi123';
    await db.insert(admins).values({
      firstName: process.env.SEED_ADMIN_FIRSTNAME || 'Admin',
      lastName: '',
      login,
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
    });
    console.log(`✓ Compte admin : identifiant « ${login} » / mot de passe « ${password} » (à changer à la 1re connexion)`);
  } else {
    console.log('• Compte admin déjà créé, rien à faire');
  }

  await pool.end();
  console.log('Terminé.');
}

main().catch((err) => {
  console.error('✗ Échec du seed :', err);
  process.exit(1);
});
