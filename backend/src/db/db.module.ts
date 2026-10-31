import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { createDb, createPool } from './client';

export const DB = Symbol('DB');
export const PG_POOL = Symbol('PG_POOL');

/** Injecte la base : constructor(@Inject(DB) private readonly db: Database) */
export const InjectDb = () => Inject(DB);

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createPool(config.getOrThrow<string>('DATABASE_URL')),
    },
    {
      provide: DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => createDb(pool),
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
