import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export function createPool(url = process.env.DATABASE_URL): Pool {
  if (!url) throw new Error('DATABASE_URL manquant dans le fichier .env');
  const pool = new Pool({ connectionString: url, max: 10 });
  // Si PostgreSQL coupe une connexion inactive (redémarrage, mise à jour…), on le note sans faire tomber l'API :
  // la connexion fautive est jetée et une nouvelle sera ouverte à la prochaine requête.
  pool.on('error', (err) => console.error('[db] connexion PostgreSQL perdue :', err.message));
  return pool;
}

export function createDb(pool: Pool): Database {
  return drizzle(pool, { schema });
}
