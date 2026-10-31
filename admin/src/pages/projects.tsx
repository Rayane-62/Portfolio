import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { IconEdit, IconExternal, IconGithub, IconLayers, IconPlus, IconStar } from '@/components/icons';
import { Button, DeleteButton, Empty, LoadError, Loading, OrderButtons, PageHeader, Switch } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { plural, PROJECT_CATEGORIES, PROJECT_ORDER } from '@/lib/format';
import { keys, queryClient, refresh } from '@/lib/queries';
import { movedIds, useReorder } from '@/lib/reorder';
import type { Project, ProjectCategory } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

const FILTERS = [['all', 'Tous'], ['visible', 'Affichés'], ['masque', 'Masqués'], ['featured', 'En avant']] as const;
type Filter = (typeof FILTERS)[number][0];

export function ProjectsPage() {
  const [sp, setSp] = useSearchParams();
  const f = sp.get('filtre');
  const filter: Filter = FILTERS.some(([k]) => k === f) ? (f as Filter) : 'all';
  const rawCat = sp.get('cat');
  const cat = PROJECT_ORDER.includes(rawCat as ProjectCategory) ? (rawCat as ProjectCategory) : '';

  // On charge la liste complète : c'est elle qui porte l'ordre d'affichage du site.
  const q = useQuery({ queryKey: keys.projects, queryFn: () => api<Project[]>('/admin/projects') });
  const all = q.data ?? [];
  const list = all.filter(
    (p) =>
      (filter === 'all' || (filter === 'visible' && p.visible) || (filter === 'masque' && !p.visible) || (filter === 'featured' && p.featured)) &&
      (!cat || p.category === cat),
  );

  const reorder = useReorder<Project>('projects', keys.projects);
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refresh(keys.projects); toast('Projet supprimé'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setSp(next, { replace: true });
  };

  async function askDelete(p: Project) {
    if (await confirm({ title: 'Supprimer ce projet ?', message: `« ${p.title} » et son image seront définitivement supprimés.`, confirmLabel: 'Supprimer', danger: true })) del.mutate(p.id);
  }

  const counts = (k: Filter) => all.filter((p) => k === 'all' || (k === 'visible' && p.visible) || (k === 'masque' && !p.visible) || (k === 'featured' && p.featured)).length;

  return (
    <div>
      <PageHeader
        crumb="Mon travail"
        title="Projets"
        action={<Link to="/projets/nouveau" className="btn"><IconPlus size={18} /> Nouveau projet</Link>}
      />

      {all.length > 0 && (
        <>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="tabs" role="tablist" aria-label="Filtrer les projets">
              {FILTERS.map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setParam('filtre', k === 'all' ? null : k)}>
                  {l}<span className="n">{counts(k)}</span>
                </button>
              ))}
            </div>
            <select aria-label="Catégorie" className="input h-9! w-auto min-w-[180px] text-[13px] max-sm:w-full" value={cat} onChange={(e) => setParam('cat', e.target.value || null)}>
              <option value="">Toutes les catégories</option>
              {PROJECT_ORDER.map((c) => <option key={c} value={c}>{PROJECT_CATEGORIES[c].label}</option>)}
            </select>
          </div>
          <p className="note mb-4">{plural(list.length, 'projet affiché ici', 'projets affichés ici')} · l'ordre des flèches est celui du site (les projets « en avant » remontent quand même en haut).</p>
        </>
      )}

      {q.isPending ? <Loading rows={3} /> : q.isError ? <LoadError error={q.error} retry={q.refetch} /> : all.length === 0 ? (
        <Empty title="Ta section Projets est vide" icon={<IconLayers size={22} />}>
          <span className="max-w-[48ch]">
            C'est la vitrine la plus regardée de ton portfolio. Ajoute ton premier projet : un titre, une catégorie, une image,
            les technologies utilisées et les liens vers le site ou le dépôt GitHub.
          </span>
          <Link to="/projets/nouveau" className="btn btn-lg"><IconPlus size={18} /> Ajouter mon premier projet</Link>
          <span className="note">Tu peux l'enregistrer masqué, le temps de le finir.</span>
        </Empty>
      ) : list.length === 0 ? (
        <Empty title="Rien avec ces filtres" icon={<IconLayers size={22} />}>
          Change le filtre ou la catégorie pour revoir tes projets.
          <Button variant="ghost" onClick={() => setSp({}, { replace: true })}>Tout afficher</Button>
        </Empty>
      ) : (
        <div className="reveal flex flex-col gap-3.5">
          {list.map((p, i) => (
            <Row
              key={p.id}
              p={p}
              index={i}
              count={list.length}
              busy={reorder.isPending}
              onMove={(d) => { const ids = movedIds(all.map((x) => x.id), p.id, d, list.map((x) => x.id)); if (ids) reorder.mutate(ids); }}
              onDelete={() => askDelete(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ p, index, count, busy, onMove, onDelete }: { p: Project; index: number; count: number; busy: boolean; onMove: (d: -1 | 1) => void; onDelete: () => void }) {
  const navigate = useNavigate();
  const visible = useMutation({
    mutationFn: (v: boolean) => api<Project>(`/admin/projects/${p.id}/visible`, { method: 'PATCH', json: { visible: v } }),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey: keys.projects });
      const prev = queryClient.getQueryData<Project[]>(keys.projects);
      if (prev) queryClient.setQueryData(keys.projects, prev.map((x) => (x.id === p.id ? { ...x, visible: v } : x)));
      return { prev };
    },
    onSuccess: (r) => { refresh(keys.projects); toast(r.visible ? 'Projet affiché sur le site' : 'Projet masqué du site'); },
    onError: (e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(keys.projects, ctx.prev); toast(errMsg(e), 'error'); },
  });

  return (
    <article className={`panel flex flex-col gap-3 transition-opacity ${p.visible ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-3.5 max-sm:flex-col">
        <button type="button" onClick={() => navigate(`/projets/${p.id}`)} aria-label={`Modifier ${p.title}`} className="shrink-0 max-sm:w-full">
          <span className="ph-tile block h-[88px] w-[132px] max-sm:h-[150px] max-sm:w-full">
            {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-full" /> : <span className="grid size-full place-items-center text-line-2"><IconLayers size={26} /></span>}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill pill-violet">{PROJECT_CATEGORIES[p.category].label}</span>
            {p.featured && <span className="pill pill-accent"><IconStar size={11} /> En avant</span>}
            {!p.visible && <span className="pill pill-off"><i />Masqué</span>}
          </div>
          <h2 className="display mt-2 mb-1 text-[19px] break-words">{p.title}</h2>
          {p.description && <p className="m-0 line-clamp-2 text-sm leading-relaxed text-soft">{p.description}</p>}
          {p.technologies.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {p.technologies.slice(0, 8).map((t) => <span key={t} className="tech">{t}</span>)}
              {p.technologies.length > 8 && <span className="label self-center">+{p.technologies.length - 8}</span>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <OrderButtons index={index} count={count} busy={busy} name={p.title} onMove={onMove} />
          <span className="flex items-center gap-2">
            <span className="label">Sur le site</span>
            <Switch checked={p.visible} disabled={visible.isPending} onChange={(v) => visible.mutate(v)} label={`Afficher ${p.title} sur le site`} />
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <span className="flex flex-wrap items-center gap-3">
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-accent-3">
              <IconExternal size={15} /> Voir en ligne
            </a>
          )}
          {p.githubUrl && (
            <a href={p.githubUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-accent-3">
              <IconGithub size={15} /> Code
            </a>
          )}
          {!p.liveUrl && !p.githubUrl && <span className="note">Aucun lien renseigné</span>}
        </span>
        <span className="flex gap-2">
          <Link to={`/projets/${p.id}`} className="btn btn-ghost btn-sm"><IconEdit size={15} /> Modifier</Link>
          <DeleteButton onClick={onDelete} label={`Supprimer ${p.title}`} />
        </span>
      </div>
    </article>
  );
}
