import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { EventsService } from './events.service';

/**
 * Flux en direct (Server-Sent Events) : GET /api/admin/events
 * Quand un message arrive par le formulaire de contact, l'admin le voit
 * dans la seconde, sans rafraîchir la page.
 */
@Controller('admin/events')
@UseGuards(AdminAuthGuard)
@SkipThrottle()
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  stream(@Req() req: Request, @Res() res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx : ne pas retenir les messages
    });
    res.write('retry: 3000\n\n');
    res.write(`data: ${JSON.stringify({ type: 'hello' })}\n\n`);

    const sub = this.events.stream$.subscribe((e) => res.write(`data: ${JSON.stringify(e)}\n\n`));
    // Un commentaire toutes les 25 s garde la connexion ouverte derrière les hébergeurs.
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
    // Le jeton est revérifié à la reconnexion : on coupe toutes les 30 min.
    const limit = setTimeout(() => res.end(), 30 * 60_000);

    req.on('close', () => {
      sub.unsubscribe();
      clearInterval(ping);
      clearTimeout(limit);
    });
  }
}
