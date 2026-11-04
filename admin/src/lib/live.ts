import { useEffect } from 'react';
import { create } from 'zustand';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/ui';
import { API_URL } from './api';
import { keys, queryClient } from './queries';
import type { LiveEvent } from './types';

/** État de la connexion en direct, affiché dans le menu (« En direct » / « Reconnexion… »). */
export const useLive = create<{ connected: boolean }>()(() => ({ connected: false }));

const CONTENT_KEYS = {
  info: keys.info,
  skills: keys.skills,
  experiences: keys.experiences,
  educations: keys.educations,
  projects: keys.projects,
} as const;

function onEvent(e: LiveEvent) {
  if (e.type === 'hello') return;
  if (e.type === 'content.updated') {
    // Un autre onglet (ou le téléphone) a modifié le contenu : on recharge la liste concernée.
    queryClient.invalidateQueries({ queryKey: CONTENT_KEYS[e.what] });
    queryClient.invalidateQueries({ queryKey: keys.dashboard });
    return;
  }
  queryClient.invalidateQueries({ queryKey: keys.messages });
  queryClient.invalidateQueries({ queryKey: keys.dashboard });
  if (e.type === 'message.created') {
    toast(`Nouveau message de ${e.name} — ${e.subject}`, 'new', 8000);
    ping();
  }
}

/**
 * Écoute l'API en continu (Server-Sent Events).
 * Un message envoyé depuis le formulaire de contact du site arrive ici dans la seconde,
 * sans rafraîchir la page. Se reconnecte tout seul (coupure Wi-Fi, PC en veille…).
 */
export function useLiveUpdates() {
  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (!token) return;
    let stopped = false;
    let ctrl: AbortController | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let wasConnected = false;

    const connect = async () => {
      ctrl = new AbortController();
      try {
        const res = await fetch(`${API_URL}/api/admin/events`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: ctrl.signal,
          cache: 'no-store',
        });
        if (res.status === 401) {
          useAuth.getState().logout();
          return;
        }
        if (!res.ok || !res.body) throw new Error(String(res.status));
        useLive.setState({ connected: true });
        // Après une coupure, on recharge tout : des choses ont pu changer entre-temps.
        if (wasConnected) queryClient.invalidateQueries();
        wasConnected = true;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let cut: number;
          while ((cut = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, cut);
            buf = buf.slice(cut + 2);
            for (const line of block.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              try {
                onEvent(JSON.parse(line.slice(6)) as LiveEvent);
              } catch {
                /* message illisible : ignoré */
              }
            }
          }
        }
      } catch {
        /* réseau coupé ou arrêt volontaire */
      }
      useLive.setState({ connected: false });
      if (!stopped) retry = setTimeout(connect, 3000);
    };

    connect();
    // Au retour sur l'onglet, on s'assure d'avoir les derniers messages.
    const onVisible = () => {
      if (document.visibilityState === 'visible') queryClient.invalidateQueries({ queryKey: keys.messages });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearTimeout(retry);
      ctrl?.abort();
      document.removeEventListener('visibilitychange', onVisible);
      useLive.setState({ connected: false });
    };
  }, [token]);
}

/** Petit « ding » quand un message arrive (si le navigateur l'autorise). */
function ping() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  } catch {
    /* pas de son : tant pis */
  }
}
