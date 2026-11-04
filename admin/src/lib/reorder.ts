import { useMutation } from '@tanstack/react-query';
import { api, errMsg } from './api';
import { queryClient } from './queries';
import { toast } from '@/store/ui';

/**
 * Réordonnancement d'une liste : l'API attend les identifiants dans le nouvel ordre
 * (`PUT /admin/<type>/order` avec `{ ids }`). L'écran bouge tout de suite et revient
 * en arrière si l'API refuse.
 */
export function useReorder<T extends { id: number }>(path: string, key: readonly unknown[]) {
  return useMutation({
    mutationFn: (ids: number[]) => api<T[]>(`/admin/${path}/order`, { method: 'PUT', json: { ids } }),
    onMutate: (ids) => {
      const prev = queryClient.getQueryData<T[]>(key);
      if (prev) queryClient.setQueryData(key, ids.map((id) => prev.find((x) => x.id === id)!).filter(Boolean));
      return { prev };
    },
    onSuccess: (d) => { queryClient.setQueryData(key, d); toast('Ordre enregistré'); },
    onError: (e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(key, ctx.prev); toast(errMsg(e), 'error'); },
  });
}

/**
 * Nouvel ordre après avoir déplacé l'élément `id` d'un cran.
 * `shownIds` sert quand la liste est filtrée : l'élément est posé à la place de sa voisine
 * **affichée**, dans la liste complète — c'est ce que l'œil attend.
 */
export function movedIds(allIds: number[], id: number, d: -1 | 1, shownIds: number[] = allIds): number[] | null {
  const targetId = shownIds[shownIds.indexOf(id) + d];
  const from = allIds.indexOf(id);
  const to = allIds.indexOf(targetId);
  if (!shownIds.includes(id) || targetId === undefined || from < 0 || to < 0) return null;
  const next = [...allIds];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
