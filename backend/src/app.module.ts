import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import {
  AdminEducationsController,
  AdminExperiencesController,
  AdminProjectsController,
  AdminSkillsController,
} from './content/admin-content.controller';
import { EducationsService } from './content/educations.service';
import { ExperiencesService } from './content/experiences.service';
import { ProjectsService } from './content/projects.service';
import { SkillsService } from './content/skills.service';
import { DbModule } from './db/db.module';
import { AdminEventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { AdminMessagesController } from './messages/messages.controller';
import { MessagesService } from './messages/messages.service';
import { AdminDashboardController, AdminInfoController } from './portfolio/portfolio.controller';
import { DashboardService } from './portfolio/dashboard.service';
import { InfoService } from './portfolio/info.service';
import { PortfolioService } from './portfolio/portfolio.service';
import { PublicController } from './public/public.controller';
import { UPLOADS_DIR } from './uploads/uploads.service';
import { UploadsModule } from './uploads/uploads.module';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite par défaut : 120 requêtes / minute / IP. Plus strict sur la connexion et le contact.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    // Photo, images des projets et CV stockés sur le serveur, dans backend/uploads.
    ServeStaticModule.forRoot({ rootPath: UPLOADS_DIR, serveRoot: '/uploads', serveStaticOptions: { index: false } }),
    DbModule,
    AuthModule,
    UploadsModule,
  ],
  controllers: [
    HealthController,
    PublicController,
    AdminInfoController,
    AdminDashboardController,
    AdminSkillsController,
    AdminExperiencesController,
    AdminEducationsController,
    AdminProjectsController,
    AdminMessagesController,
    AdminEventsController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    EventsService,
    InfoService,
    PortfolioService,
    DashboardService,
    SkillsService,
    ExperiencesService,
    EducationsService,
    ProjectsService,
    MessagesService,
  ],
})
export class AppModule {}
