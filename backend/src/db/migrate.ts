import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { createDb, createPool } from './client';

/** Crée la base indiquée dans DATABASE_URL si elle n'existe pas encore (ex. « portfolio »). */
async function ensureDatabase(url: string) {
  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.replace(/^\//, ''));
  if (!name) return;
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new Client({ connectionString: admin.toString() });
  try {
    await client.connect();
  } catch {
    return; // pas d'accès à la base « postgres » : on laisse migrate signaler l'erreur réelle
  }
  try {
    const found = await client.query('select 1 from pg_database where datname = $1', [name]);
    if (!found.rowCount) {
      await client.query(`create database "${name.replace(/"/g, '""')}"`);
      console.log(`✓ Base « ${name} » créée`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquant dans le fichier .env');
  await ensureDatabase(url);
  const pool = createPool(url);
  const db = createDb(pool);
  console.log('→ Application des migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✓ Base de données à jour');
  await pool.end();
}

main().catch((err) => {
  console.error('✗ Échec des migrations :', err);
  process.exit(1);
});
