import { QueryClient, useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { Education, Experience, Info, MessageList, Skill } from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true },
  },
});

/** Clés de cache : invalider une clé recharge toutes les vues qui l'utilisent. */
export const keys = {
  dashboard: ['dashboard'] as const,
  info: ['info'] as const,
  skills: ['skills'] as const,
  experiences: ['experiences'] as const,
  educations: ['educations'] as const,
  projects: ['projects'] as const,
  messages: ['messages'] as const,
};

export const useInfo = () => useQuery({ queryKey: keys.info, queryFn: () => api<Info>('/admin/info') });
export const useSkills = () => useQuery({ queryKey: keys.skills, queryFn: () => api<Skill[]>('/admin/skills') });
export const useExperiences = () => useQuery({ queryKey: keys.experiences, queryFn: () => api<Experience[]>('/admin/experiences') });
export const useEducations = () => useQuery({ queryKey: keys.educations, queryFn: () => api<Education[]>('/admin/educations') });

/** Nombre de messages non lus (badge du menu). */
export const useUnreadCount = () =>
  useQuery({
    queryKey: [...keys.messages, 'unread'],
    queryFn: () => api<MessageList>('/admin/messages?limit=1'),
    select: (d) => d.unread,
    refetchInterval: 60_000,
  });

/** Après une modification : recharge les listes concernées + le tableau de bord. */
export function refresh(...k: (readonly unknown[])[]) {
  for (const key of k) queryClient.invalidateQueries({ queryKey: key });
  queryClient.invalidateQueries({ queryKey: keys.dashboard });
}
