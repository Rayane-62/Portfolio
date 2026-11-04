import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

/**
 * Ce qui est diffusé en direct à l'admin connecté (plusieurs onglets ou appareils).
 * Seulement des identifiants : l'écran recharge ensuite ses données.
 */
export type AdminEvent =
  | { type: 'message.created'; messageId: number; name: string; subject: string }
  | { type: 'message.updated'; messageId: number }
  | { type: 'message.deleted'; messageId: number }
  | { type: 'content.updated'; what: 'info' | 'skills' | 'experiences' | 'educations' | 'projects' };

@Injectable()
export class EventsService {
  private readonly bus = new Subject<AdminEvent>();
  readonly stream$ = this.bus.asObservable();

  emit(event: AdminEvent) {
    this.bus.next(event);
  }
}
