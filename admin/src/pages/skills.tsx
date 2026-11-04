import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router';
import { IconEdit, IconPlus, IconSpark } from '@/components/icons';
import { Button, DeleteButton, Drawer, Empty, ErrorText, Field, Help, LoadError, Loading, OrderButtons, PageHeader, Segmented, Thumb } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { plural, SKILL_CATEGORIES, SKILL_ORDER } from '@/lib/format';
import { keys, refresh, useSkills } from '@/lib/queries';
import { movedIds, useReorder } from '@/lib/reorder';
import type { Skill, SkillCategory } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg';

export function SkillsPage() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('cat');
  const cat = SKILL_ORDER.includes(raw as SkillCategory) ? (raw as SkillCategory) : 'all';
  const [edit, setEdit] = useState<Skill | 'new' | null>(null);
  const q = useSkills();
  const all = q.data ?? [];
  const list = cat === 'all' ? all : all.filter((s) => s.category === cat);

  const reorder = useReorder<Skill>('skills', keys.skills);
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/skills/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refresh(keys.skills); toast('Compétence supprimée'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  /** Même filtrée par catégorie, la compétence se pose à la place de sa voisine affichée. */
  const move = (s: Skill, d: -1 | 1) => {
    const ids = movedIds(all.map((x) => x.id), s.id, d, list.map((x) => x.id));
    if (ids) reorder.mutate(ids);
  };

  async function askDelete(s: Skill) {
    if (await confirm({ title: 'Supprimer la compétence ?', message: `« ${s.name} » disparaîtra de la section Compétences du site.`, confirmLabel: 'Supprimer', danger: true })) del.mutate(s.id);
  }

  const counts = (c: SkillCategory) => all.filter((s) => s.category === c).length;

  return (
    <div>
      <PageHeader
        crumb="Ce que je sais faire"
        title="Compétences"
        action={<Button onClick={() => setEdit('new')}><IconPlus size={18} /> Nouvelle compétence</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="tabs" role="tablist" aria-label="Filtrer par catégorie">
          <button type="button" role="tab" aria-selected={cat === 'all'} onClick={() => setSp({}, { replace: true })}>Toutes<span className="n">{all.length}</span></button>
          {SKILL_ORDER.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setSp({ cat: c }, { replace: true })}>
              {SKILL_CATEGORIES[c].label}<span className="n">{counts(c)}</span>
            </button>
          ))}
        </div>
        <span className="label max-sm:hidden">{plural(list.length, 'compétence affichée', 'compétences affichées')}</span>
      </div>

      {q.isPending ? <Loading /> : q.isError ? <LoadError error={q.error} retry={q.refetch} /> : list.length === 0 ? (
        <Empty title="Aucune compétence ici" icon={<IconSpark size={22} />}>
          {cat === 'all' ? 'Ajoute ta première compétence.' : 'Cette catégorie est vide : change de filtre ou ajoute une compétence.'}
          <Button onClick={() => setEdit('new')}><IconPlus size={18} /> Nouvelle compétence</Button>
        </Empty>
      ) : (
        <section className="panel animate-up overflow-hidden p-0!">
          <table className="t">
            <thead>
              <tr>
                <th className="w-[1%]">Ordre</th>
                <th>Compétence</th>
                <th className="max-sm:hidden">Catégorie</th>
                <th className="w-[1%]" />
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={s.id}>
                  <td><OrderButtons index={i} count={list.length} busy={reorder.isPending} name={s.name} onMove={(d) => move(s, d)} /></td>
                  <td className="w-full max-w-0">
                    <button type="button" onClick={() => setEdit(s)} className="flex w-full min-w-0 items-center gap-3 text-left">
                      <Thumb src={s.iconUrl || null} alt="" logo className="max-sm:size-9!" />
                      <span className="min-w-0">
                        <b className="block truncate font-semibold">{s.name}</b>
                        <span className="label block truncate sm:hidden">{SKILL_CATEGORIES[s.category].label}</span>
                        <span className={`label block truncate normal-case max-sm:hidden ${s.iconUrl ? '' : 'text-warn!'}`}>
                          {s.iconUrl ? s.iconUrl.replace(/^https?:\/\//, '') : 'Sans logo — seul le nom s’affiche'}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="max-sm:hidden"><span className="pill pill-violet">{SKILL_CATEGORIES[s.category].label}</span></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEdit(s)} aria-label={`Modifier ${s.name}`}><IconEdit size={15} /><span className="max-md:hidden">Modifier</span></Button>
                      <DeleteButton onClick={() => askDelete(s)} label={`Supprimer ${s.name}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {edit && <SkillDrawer skill={edit === 'new' ? null : edit} defaultCategory={cat === 'all' ? 'frontend' : cat} onClose={() => setEdit(null)} />}
    </div>
  );
}

function SkillDrawer({ skill, defaultCategory, onClose }: { skill: Skill | null; defaultCategory: SkillCategory; onClose: () => void }) {
  const [name, setName] = useState(skill?.name ?? '');
  const [iconUrl, setIconUrl] = useState(skill?.iconUrl ?? '');
  const [category, setCategory] = useState<SkillCategory>(skill?.category ?? defaultCategory);
  const [error, setError] = useState('');
  const [broken, setBroken] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      skill
        ? api<Skill>(`/admin/skills/${skill.id}`, { method: 'PATCH', json: { name: name.trim(), iconUrl: iconUrl.trim(), category } })
        : api<Skill>('/admin/skills', { method: 'POST', json: { name: name.trim(), iconUrl: iconUrl.trim(), category } }),
    onSuccess: () => {
      refresh(keys.skills);
      toast(skill ? 'Compétence modifiée' : `« ${name.trim()} » ajoutée`);
      onClose();
    },
    onError: (e) => setError(errMsg(e)),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Donne un nom à la compétence.');
    if (iconUrl.trim() && !/^https?:\/\//.test(iconUrl.trim())) return setError("L'adresse du logo doit commencer par https://");
    save.mutate();
  }

  return (
    <Drawer
      title={skill ? `Modifier ${skill.name}` : 'Nouvelle compétence'}
      onClose={onClose}
      header={
        <>
          <span className="label block">{skill ? 'Modifier' : 'Ajouter'}</span>
          <b className="display block text-xl break-words">{skill ? skill.name : 'Nouvelle compétence'}</b>
        </>
      }
      footer={
        <>
          <Button onClick={submit} loading={save.isPending}>{skill ? 'Enregistrer' : 'Ajouter'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
        <Field label="Nom" hint="Tel qu'il s'affiche sous le logo sur le site.">
          <input className="input" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} maxLength={80} autoFocus />
        </Field>

        <Field label="Catégorie" hint={SKILL_CATEGORIES[category].hint} as="div">
          <Segmented
            value={category}
            onChange={setCategory}
            label="Catégorie de la compétence"
            options={SKILL_ORDER.map((c) => [c, SKILL_CATEGORIES[c].label])}
          />
        </Field>

        <Field label="Adresse du logo" error={broken ? "Cette adresse ne charge aucune image : vérifie-la." : undefined} as="div">
          <div className="flex items-center gap-3">
            <span className="thumb logo size-14!">
              {iconUrl.trim() ? (
                <img src={iconUrl.trim()} alt="" onLoad={() => setBroken(false)} onError={() => setBroken(true)} />
              ) : (
                <IconSpark size={20} />
              )}
            </span>
            <input
              className={`input ${broken ? 'is-bad' : ''}`}
              value={iconUrl}
              onChange={(e) => { setIconUrl(e.target.value); setBroken(false); setError(''); }}
              placeholder={DEVICON}
              maxLength={1000}
              inputMode="url"
              aria-label="Adresse du logo"
            />
          </div>
          <span className="note">L'aperçu à gauche est exactement ce que le site affichera. Laisse vide pour n'afficher que le nom.</span>
          <Help title="Où trouver cette adresse ?">
            Les logos viennent de <b>devicon</b>, une bibliothèque gratuite de logos de technologies.
            <br />1. Ouvre <code>devicon.dev</code> et cherche la technologie (React, Kotlin, Docker…).
            <br />2. Clique sur son logo : le site te donne un lien du CDN jsDelivr.
            <br />3. Colle-le ici. Il ressemble toujours à ça :
            <br /><code>{DEVICON}</code>
            <br />Le mot au milieu est le nom de la techno, et <code>-original</code> peut devenir <code>-plain</code> pour une version d'une seule couleur.
            <Button variant="ghost" size="sm" className="mt-2.5" onClick={() => { setIconUrl(DEVICON); setBroken(false); }}>Essayer avec l'exemple</Button>
          </Help>
        </Field>

        <ErrorText>{error}</ErrorText>
        <p className="note m-0">Deux compétences ne peuvent pas porter le même nom.</p>
      </form>
    </Drawer>
  );
}
