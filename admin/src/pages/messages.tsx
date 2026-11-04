import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { IconCheck, IconCheckAll, IconMail, IconPhone, IconSearch, IconTrash, IconWhatsapp } from '@/components/icons';
import { Button, Drawer, Empty, LoadError, Loading, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { ago, formatDate, plural, telLink, waLink } from '@/lib/format';
import { keys, queryClient, refresh } from '@/lib/queries';
import { useLive } from '@/lib/live';
import type { Message, MessageList } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

const FILTERS = [['all', 'Tous'], ['nonlus', 'Non lus'], ['lus', 'Lus']] as const;
type Filter = (typeof FILTERS)[number][0];

export function MessagesPage() {
  const [sp, setSp] = useSearchParams();
  const f = sp.get('filtre');
  const filter: Filter = FILTERS.some(([k]) => k === f) ? (f as Filter) : 'all';
  const openId = Number(sp.get('ouvrir')) || null;
  const [limit, setLimit] = useState(30);
  const [q, setQ] = useState('');
  const connected = useLive((s) => s.connected);

  const list = useQuery({
    queryKey: [...keys.messages, 'list', filter, limit],
    queryFn: () => api<MessageList>(`/admin/messages?limit=${limit}${filter === 'all' ? '' : `&filter=${filter}`}`),
    placeholderData: (prev) => prev,
  });

  const readAll = useMutation({
    mutationFn: () => api<{ ok: boolean; count: number }>('/admin/messages/read-all', { method: 'PATCH' }),
    onSuccess: (r) => { refresh(keys.messages); toast(r.count > 0 ? `${plural(r.count, 'message marqué', 'messages marqués')} comme lu(s)` : 'Tout était déjà lu'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setSp(next, { replace: true });
  };

  const term = q.trim().toLowerCase();
  // Les non lus d'abord, puis du plus récent au plus ancien.
  const items = (list.data?.items ?? [])
    .filter((m) => !term || [m.name, m.email, m.subject, m.message, m.phone ?? ''].some((v) => v.toLowerCase().includes(term)))
    .sort((a, b) => Number(a.read) - Number(b.read) || +new Date(b.createdAt) - +new Date(a.createdAt));
  const unread = list.data?.unread ?? 0;

  return (
    <div>
      <PageHeader
        crumb="Formulaire de contact du site"
        title="Messages"
        action={
          <>
            <span className="label flex items-center gap-2 self-center normal-case">
              <span className={`live-dot ${connected ? '' : 'off'}`} />{connected ? 'En direct' : 'Reconnexion…'}
            </span>
            <Button variant="ghost" onClick={() => readAll.mutate()} loading={readAll.isPending} disabled={unread === 0}>
              <IconCheckAll size={17} /> Tout marquer comme lu
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="tabs" role="tablist" aria-label="Filtrer les messages">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => { setParam('filtre', k === 'all' ? null : k); setLimit(30); }}>
              {l}{k === 'nonlus' && unread > 0 ? <span className="n">{unread}</span> : null}
            </button>
          ))}
        </div>
        <label className="relative w-[300px] max-w-full max-sm:w-full">
          <span className="sr-only">Rechercher</span>
          <IconSearch size={16} className="pointer-events-none absolute top-[13px] left-3 text-muted" />
          <input className="input pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, un objet…" />
        </label>
      </div>

      {list.isPending ? <Loading /> : list.isError ? <LoadError error={list.error} retry={list.refetch} /> : items.length === 0 ? (
        <Empty title={term ? 'Rien ne correspond' : filter === 'nonlus' ? 'Tout est lu' : 'Aucun message'} icon={<IconMail size={22} />}>
          {term
            ? 'Change ta recherche.'
            : filter === 'nonlus'
              ? 'Tu as répondu à tout le monde.'
              : 'Les demandes envoyées depuis le formulaire de contact du site arrivent ici, en direct, avec un petit son.'}
        </Empty>
      ) : (
        <>
          <section className="panel animate-up overflow-hidden p-0!">
            <table className="t">
              <thead>
                <tr>
                  <th className="w-[1%]" />
                  <th>Objet</th>
                  <th className="max-md:hidden">De</th>
                  <th className="max-sm:hidden">Reçu</th>
                  <th className="w-[1%]" />
                </tr>
              </thead>
              <tbody>
                {items.map((m) => <Row key={m.id} m={m} selected={m.id === openId} onOpen={() => setParam('ouvrir', String(m.id))} />)}
              </tbody>
            </table>
          </section>
          {(list.data?.total ?? 0) > (list.data?.items.length ?? 0) && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" loading={list.isFetching} onClick={() => setLimit((l) => l + 30)}>
                Voir plus ({(list.data?.total ?? 0) - (list.data?.items.length ?? 0)})
              </Button>
            </div>
          )}
        </>
      )}

      {openId && <MessageDrawer key={openId} id={openId} onClose={() => setParam('ouvrir', null)} />}
    </div>
  );
}

function useSetRead(id: number) {
  return useMutation({
    mutationFn: (read: boolean) => api<Message>(`/admin/messages/${id}/read`, { method: 'PATCH', json: { read } }),
    onSuccess: () => refresh(keys.messages),
    onError: (e) => toast(errMsg(e), 'error'),
  });
}

function Row({ m, selected, onOpen }: { m: Message; selected: boolean; onOpen: () => void }) {
  const read = useSetRead(m.id);
  return (
    <tr onClick={onOpen} className={`clickable ${selected ? 'is-on' : ''}`}>
      <td>
        <span className={`grid size-9 place-items-center rounded-xl border ${m.read ? 'border-line text-muted' : 'border-accent/45 text-accent'}`} title={m.read ? 'Lu' : 'Non lu'}>
          <IconMail size={16} />
        </span>
      </td>
      <td className="w-full max-w-0 min-w-[140px]">
        <b className={`block truncate ${m.read ? 'font-medium text-soft' : 'font-semibold'}`}>{m.subject}</b>
        <span className="block truncate text-[12.5px] text-muted">
          <span className="md:hidden">{m.name} · </span>{m.message.slice(0, 90)}
        </span>
        <span className="label mt-0.5 block sm:hidden">{ago(m.createdAt)}</span>
      </td>
      <td className="max-md:hidden">
        <b className="block truncate text-sm">{m.name}</b>
        <span className="label block truncate normal-case">{m.phone ?? m.email}</span>
      </td>
      <td className="whitespace-nowrap text-muted max-sm:hidden">{ago(m.createdAt)}</td>
      <td>
        <div className="flex justify-end gap-2">
          {!m.read && (
            <Button variant="ghost" size="sm" loading={read.isPending} onClick={(e) => { e.stopPropagation(); read.mutate(true); }} aria-label={`Marquer « ${m.subject} » comme lu`}>
              <IconCheck size={15} /><span className="max-lg:hidden">Marquer lu</span>
            </Button>
          )}
          <Button variant="plain" size="sm" icon onClick={onOpen} aria-label={`Ouvrir « ${m.subject} »`}>→</Button>
        </div>
      </td>
    </tr>
  );
}

function MessageDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const q = useQuery({ queryKey: [...keys.messages, 'detail', id], queryFn: () => api<Message>(`/admin/messages/${id}`) });
  const read = useSetRead(id);
  const m = q.data;

  // Ouvrir un message le marque comme lu (une seule fois).
  const marked = useRef(false);
  const markRead = read.mutate;
  useEffect(() => {
    if (m && !m.read && !marked.current) {
      marked.current = true;
      markRead(true);
    }
  }, [m, markRead]);

  const del = useMutation({
    mutationFn: () => api(`/admin/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: [...keys.messages, 'detail', id] });
      refresh(keys.messages);
      toast('Message supprimé');
      onClose();
    },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  async function askDelete() {
    if (await confirm({ title: 'Supprimer ce message ?', message: 'Il sera définitivement effacé. Pense à répondre avant, si besoin.', confirmLabel: 'Supprimer', danger: true })) del.mutate();
  }

  const mailto = m ? `mailto:${m.email}?subject=${encodeURIComponent(`Re : ${m.subject}`)}` : '#';

  return (
    <Drawer
      title={m?.subject ?? 'Message'}
      onClose={onClose}
      header={
        <>
          <span className="label block">{m ? formatDate(m.createdAt) : 'Chargement…'}</span>
          <b className="display block text-xl break-words">{m?.subject ?? '…'}</b>
        </>
      }
      footer={
        m ? (
          <>
            <a href={mailto} className="btn" title={`Répondre à ${m.email}`}><IconMail size={16} /> Répondre</a>
            {m.phone && (
              <>
                <a href={telLink(m.phone)} className="btn btn-ghost"><IconPhone size={16} /> Appeler</a>
                <a href={waLink(m.phone)} target="_blank" rel="noopener" className="btn btn-ghost"><IconWhatsapp size={16} /> WhatsApp</a>
              </>
            )}
            <Button variant="bad" onClick={askDelete} loading={del.isPending} className="ml-auto"><IconTrash size={16} /> Supprimer</Button>
          </>
        ) : undefined
      }
    >
      {q.isPending ? <Loading rows={2} /> : q.isError ? <LoadError error={q.error} retry={q.refetch} /> : m ? (
        <>
          <section className="panel flex flex-col gap-2.5">
            <h3 className="panel-title m-0!">Qui écrit <span className={`pill ${m.read ? 'pill-off' : 'pill-accent'}`}><i />{m.read ? 'Lu' : 'Non lu'}</span></h3>
            <div className="row">
              <span className="label">Nom</span>
              <b className="text-sm">{m.name}</b>
            </div>
            <div className="row">
              <span className="label">E-mail</span>
              <a href={mailto} className="text-sm break-all text-accent-3 hover:underline">{m.email}</a>
            </div>
            <div className="row">
              <span className="label">Téléphone</span>
              {m.phone ? <a href={telLink(m.phone)} className="num text-sm text-accent-3 hover:underline">{m.phone}</a> : <span className="note">Non renseigné (facultatif)</span>}
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title m-0! mb-3!">Message</h3>
            <p className="m-0 text-[14.5px] leading-relaxed whitespace-pre-wrap text-soft">{m.message}</p>
          </section>

          <Button variant="ghost" onClick={() => read.mutate(!m.read)} loading={read.isPending} className="self-start">
            {m.read ? 'Remettre en non lu' : 'Marquer comme lu'}
          </Button>
        </>
      ) : null}
    </Drawer>
  );
}
