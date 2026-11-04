import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { parseLocale } from '../common/locale';
import { CreateMessageDto } from '../messages/messages.dto';
import { MessagesService } from '../messages/messages.service';
import { PortfolioService } from '../portfolio/portfolio.service';

/** Routes publiques utilisées par le site — aucune connexion requise. */
@Controller('public')
export class PublicController {
  constructor(
    private readonly portfolio: PortfolioService,
    private readonly messages: MessagesService,
  ) {}

  /**
   * Tout ce dont le site a besoin pour s'afficher, en une seule requête,
   * déjà traduit : ?locale=fr|en|es|ar (langue inconnue ou absente = français).
   */
  @Get('portfolio')
  get(@Query('locale') locale?: string) {
    return this.portfolio.get(parseLocale(locale));
  }

  /**
   * Formulaire de contact : 10 messages par 10 minutes et par IP.
   * Assez pour une vraie personne qui s'y reprend, trop peu pour un robot.
   */
  @Post('contact')
  @Throttle({ default: { limit: 10, ttl: 10 * 60_000 } })
  contact(@Body() dto: CreateMessageDto) {
    return this.messages.create(dto);
  }
}
