import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Derrière un hébergeur (Railway, Render, Nginx…) pour que la limite par IP voie la vraie IP.
  app.set('trust proxy', 1);

  // La photo, les images des projets et le CV doivent pouvoir s'afficher sur les deux sites (autres origines).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3300,http://localhost:5200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: false });

  // /health reste hors du préfixe ; /uploads est servi à part par ServeStaticModule.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignore les champs inconnus
      forbidNonWhitelisted: false,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4300);
  await app.listen(port);
  Logger.log(`API Portfolio prête sur http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
