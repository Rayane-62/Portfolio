import { useMutation, useQuery } from '@tanstack/react-query';
import { type DragEvent, useRef, useState } from 'react';
import { IconClose, IconImage, IconPlus, IconStar } from '@/components/icons';
import { Button, DeleteButton, ErrorText, Field, LoadError, Loading, OrderButtons, Spinner, TechInput, TransField } from '@/components/ui';
import { api, errMsg, upload } from '@/lib/api';
import { LOCALES, locField, PLATFORM_LABELS, PLATFORM_ORDER, plural } from '@/lib/format';
import { keys, queryClient, refresh } from '@/lib/queries';
import type { Locale, Platform, ProjectImage, ProjectSection } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

const MAX_IMAGE_MB = 15;
const SECTION_FIELDS = ['title', 'subtitle', 'description', 'features'] as const;
type SectionTexts = Record<(typeof SECTION_FIELDS)[number], Record<Locale, string>>;

/** Tout ce qui se modifie dans une partie / un sous-projet (hors photos). */
interface SectionForm {
  texts: SectionTexts;
  platforms: Platform[];
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
}

const sectionsKey = (projectId: number) => [...keys.projects, 'sections', projectId] as const;

/** Déplace l'élément d'index i de d cases (-1 / +1) et renvoie les ids dans le nouvel ordre. */
function moved<T extends { id: number }>(list: T[], i: number, d: -1 | 1) {
  const ids = list.map((x) => x.id);
  [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
  return ids;
}

/**
 * Les parties d'un projet et leurs photos. Chaque action est enregistrée tout de suite
 * (pas besoin du bouton « Enregistrer » du projet) ; l'API renvoie la liste à jour.
 */
export function ProjectGallery({ projectId, loc, coverChosen, sub }: { projectId: number; loc: Locale; coverChosen: boolean; sub: boolean }) {
  const q = useQuery({
    queryKey: sectionsKey(projectId),
    queryFn: () => api<ProjectSection[]>(`/admin/projects/${projectId}/sections`),
  });
  const [newTitle, setNewTitle] = useState('');

  const apply = (sections: ProjectSection[]) => {
    queryClient.setQueryData(sectionsKey(projectId), sections);
    refresh(keys.projects);
  };

  const create = useMutation({
    mutationFn: (title: string) => api<ProjectSection[]>(`/admin/projects/${projectId}/sections`, { method: 'POST', json: { title } }),
    onSuccess: (s) => { apply(s); setNewTitle(''); toast('Partie ajoutée'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });
  const reorder = useMutation({
    mutationFn: (ids: number[]) => api<ProjectSection[]>(`/admin/projects/${projectId}/sections/order`, { method: 'PUT', json: { ids } }),
    onSuccess: apply,
    onError: (e) => toast(errMsg(e), 'error'),
  });

  if (q.isPending) return <Loading rows={2} />;
  if (q.isError) return <LoadError error={q.error} retry={q.refetch} />;
  const sections = q.data;
  const total = sections.reduce((n, s) => n + s.images.length, 0);
  const firstImage = sections.find((s) => s.images.length)?.images[0];

  return (
    <div className="flex flex-col gap-3.5">
      <p className="note m-0">
        {sub
          ? 'Chaque sous-projet devient une carte dans la fenêtre du projet : un clic ouvre sa description, ses plateformes, ses technologies et ses photos.'
          : 'Une partie = un onglet de la fenêtre du projet sur le site (ex. « Site admin », « App clients », « App livreurs »).'}
        {total > 0 && <> {plural(sections.length, 'partie', 'parties')} · {plural(total, 'photo', 'photos')}.</>}
        {!coverChosen && firstImage && <> La 1<sup>re</sup> photo sert de couverture tant qu'aucune n'est choisie plus haut.</>}
      </p>

      {sections.map((s, i) => (
        <SectionCard
          key={s.id}
          projectId={projectId}
          section={s}
          loc={loc}
          index={i}
          count={sections.length}
          isCover={!coverChosen && firstImage?.sectionId === s.id}
          sub={sub}
          busy={reorder.isPending}
          onMove={(d) => reorder.mutate(moved(sections, i, d))}
          onChange={apply}
        />
      ))}

      <form
        className="flex flex-wrap items-end gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          const t = newTitle.trim();
          if (!t) return toast('Donne un nom à la partie (ex. « Site admin »).', 'error');
          create.mutate(t);
        }}
      >
        <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <span className="label">{sub ? 'Nouveau sous-projet' : 'Nouvelle partie'}</span>
          <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={120} placeholder={sections.length ? 'App livreur' : 'Web admin'} />
        </label>
        <Button type="submit" variant="ghost" loading={create.isPending}><IconPlus size={16} /> {sub ? 'Ajouter le sous-projet' : 'Ajouter la partie'}</Button>
      </form>
    </div>
  );
}

function formOf(s: ProjectSection): SectionForm {
  return {
    texts: Object.fromEntries(
      SECTION_FIELDS.map((f) => [f, Object.fromEntries(LOCALES.map((l) => [l, (s as unknown as Record<string, string | null>)[locField(f, l)] ?? '']))]),
    ) as SectionTexts,
    platforms: s.platforms ?? [],
    technologies: s.technologies ?? [],
    liveUrl: s.liveUrl ?? '',
    githubUrl: s.githubUrl ?? '',
  };
}

function SectionCard({
  projectId, section, loc, index, count, isCover, sub, busy, onMove, onChange,
}: {
  projectId: number;
  section: ProjectSection;
  loc: Locale;
  index: number;
  count: number;
  isCover: boolean;
  sub: boolean;
  busy: boolean;
  onMove: (d: -1 | 1) => void;
  onChange: (s: ProjectSection[]) => void;
}) {
  const base = `/admin/projects/${projectId}`;
  const [form, setForm] = useState(() => formOf(section));
  const [saved, setSaved] = useState(() => JSON.stringify(formOf(section)));
  const texts = form.texts;
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(form) !== saved;

  const setText = (field: keyof SectionTexts) => (l: Locale, v: string) => {
    setForm((f) => ({ ...f, texts: { ...f.texts, [field]: { ...f.texts[field], [l]: v } } }));
    setError('');
  };
  const setField = <K extends keyof SectionForm>(k: K, v: SectionForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  const save = useMutation({
    mutationFn: () => {
      const json: Record<string, unknown> = {
        platforms: PLATFORM_ORDER.filter((p) => form.platforms.includes(p)),
        technologies: form.technologies,
        liveUrl: form.liveUrl.trim(),
        githubUrl: form.githubUrl.trim(),
      };
      for (const f of SECTION_FIELDS) for (const l of LOCALES) json[locField(f, l)] = texts[f][l].trim();
      return api<ProjectSection[]>(`${base}/sections/${section.id}`, { method: 'PATCH', json });
    },
    onSuccess: (s) => { onChange(s); setSaved(JSON.stringify(form)); toast(sub ? 'Sous-projet enregistré' : 'Partie enregistrée'); },
    onError: (e) => setError(errMsg(e)),
  });
  const removeSection = useMutation({
    mutationFn: () => api<ProjectSection[]>(`${base}/sections/${section.id}`, { method: 'DELETE' }),
    onSuccess: (s) => { onChange(s); toast('Partie supprimée'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });
  const reorderImages = useMutation({
    mutationFn: (ids: number[]) => api<ProjectSection[]>(`${base}/sections/${section.id}/images/order`, { method: 'PUT', json: { ids } }),
    onSuccess: onChange,
    onError: (e) => toast(errMsg(e), 'error'),
  });
  const removeImage = useMutation({
    mutationFn: (id: number) => api<ProjectSection[]>(`${base}/images/${id}`, { method: 'DELETE' }),
    onSuccess: (s) => { onChange(s); toast('Photo supprimée'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  /** Envoie les fichiers un par un (barre de progression), puis les range d'un coup dans la partie. */
  async function addFiles(list: FileList | File[]) {
    const files = [...list].filter((f) => /^image\//.test(f.type));
    const tooBig = files.filter((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
    const ok = files.filter((f) => f.size <= MAX_IMAGE_MB * 1024 * 1024);
    if (tooBig.length) toast(`${plural(tooBig.length, 'photo ignorée', 'photos ignorées')} : ${MAX_IMAGE_MB} Mo maximum`, 'error');
    if (!ok.length) {
      if (!files.length) toast('Choisis des images (JPG, PNG, WebP ou AVIF).', 'error');
      return;
    }
    // Le nom des fichiers donne l'ordre : 01-accueil.png, 02-panier.png…
    ok.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
    setProgress({ done: 0, total: ok.length });
    const ids: string[] = [];
    let failed = 0;
    for (const file of ok) {
      try {
        ids.push((await upload(file, 'project')).publicId);
      } catch {
        failed++;
      }
      setProgress((p) => p && { ...p, done: p.done + 1 });
    }
    try {
      if (ids.length) {
        onChange(await api<ProjectSection[]>(`${base}/sections/${section.id}/images`, { method: 'POST', json: { publicIds: ids } }));
        toast(`${plural(ids.length, 'photo ajoutée', 'photos ajoutées')}`);
      }
      if (failed) toast(`${plural(failed, 'photo n\'a pas pu être envoyée', 'photos n\'ont pas pu être envoyées')}`, 'error');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setProgress(null);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    addFiles(e.dataTransfer.files);
  }

  const images = section.images;
  const uploading = progress !== null;

  return (
    <section className="rounded-2xl border border-line bg-sunk/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <b className="display text-[15px]">
          {texts.title.fr.trim() || section.title}
          <span className="label ml-2">{plural(images.length, 'photo', 'photos')}</span>
        </b>
        <span className="flex items-center gap-2">
          <OrderButtons index={index} count={count} busy={busy} name={section.title} onMove={onMove} />
          <DeleteButton
            label={`Supprimer la partie ${section.title}`}
            busy={removeSection.isPending}
            onClick={async () => {
              if (await confirm({
                title: 'Supprimer cette partie ?',
                message: `« ${section.title} » et ${plural(images.length, 'sa photo', 'ses photos')} seront définitivement supprimées.`,
                confirmLabel: 'Supprimer',
                danger: true,
              })) removeSection.mutate();
            }}
          />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <TransField label={sub ? 'Nom du sous-projet' : 'Nom de la partie'} loc={loc} values={texts.title} onChange={setText('title')} maxLength={120} placeholder={sub ? 'App livreur' : 'Site admin'} />
        <TransField label="Sous-titre" loc={loc} values={texts.subtitle} onChange={setText('subtitle')} maxLength={200} placeholder={sub ? 'Pour les livreurs indépendants' : 'Web · Android · iOS'} />
      </div>
      {sub && (
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Plateformes" as="div">
            <div className="seg" role="group" aria-label="Plateformes du sous-projet">
              {PLATFORM_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={form.platforms.includes(p)}
                  onClick={() => setField('platforms', form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p])}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </Field>
          <TransField label="Description" loc={loc} values={texts.description} onChange={setText('description')} maxLength={6000} rows={4} placeholder="Ce que fait ce sous-projet, pour qui." />
          <TransField label="Fonctionnalités" loc={loc} values={texts.features} onChange={setText('features')} maxLength={4000} rows={4} placeholder={'Suivi des courses en temps réel\nHistorique des gains'} hint="Une par ligne." />
          <Field label="Technologies" as="div">
            <TechInput value={form.technologies} onChange={(v) => setField('technologies', v)} suggestions={['React Native', 'Expo', 'Next.js', 'React', 'Vite', 'NestJS']} />
          </Field>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Lien en ligne">
              <input className="input" value={form.liveUrl} onChange={(e) => setField('liveUrl', e.target.value)} placeholder="https://…" inputMode="url" maxLength={1000} />
            </Field>
            <Field label="Dépôt GitHub">
              <input className="input" value={form.githubUrl} onChange={(e) => setField('githubUrl', e.target.value)} placeholder="https://github.com/…" inputMode="url" maxLength={1000} />
            </Field>
          </div>
        </div>
      )}
      {dirty && (
        <div className="mt-2.5 flex gap-2">
          <Button
            size="sm"
            loading={save.isPending}
            onClick={() => {
              if (!texts.title.fr.trim()) return setError('Le nom (en français) est obligatoire.');
              for (const v of [form.liveUrl, form.githubUrl]) if (v.trim() && !/^https?:\/\//.test(v.trim())) return setError('Les liens doivent commencer par https://');
              save.mutate();
            }}
          >
            {sub ? 'Enregistrer le sous-projet' : 'Enregistrer la partie'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setForm(JSON.parse(saved)); setError(''); }}>Annuler</Button>
        </div>
      )}
      <ErrorText>{error}</ErrorText>

      <div className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
        {images.map((img, i) => (
          <Shot
            key={img.id}
            img={img}
            index={i}
            count={images.length}
            cover={isCover && i === 0}
            busy={reorderImages.isPending || removeImage.isPending}
            onMove={(d) => reorderImages.mutate(moved(images, i, d))}
            onRemove={async () => {
              if (await confirm({ title: 'Supprimer cette photo ?', message: 'Elle sera supprimée du serveur.', confirmLabel: 'Supprimer', danger: true })) removeImage.mutate(img.id);
            }}
          />
        ))}
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={`drop ${over ? 'is-over' : ''} min-h-[120px] p-3!`}
        >
          {uploading ? <Spinner className="text-accent-2" /> : <IconImage size={22} className="text-accent-2" />}
          <b className="text-[13px] text-fg">{uploading ? `Envoi ${progress.done}/${progress.total}…` : 'Ajouter des photos'}</b>
          {!uploading && <span className="note text-[11.5px]">Glisse-dépose ou clique · plusieurs à la fois</span>}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/png,image/webp,image/jpeg,image/avif"
        hidden
        onChange={(e) => { const files = e.target.files ? [...e.target.files] : []; e.target.value = ''; addFiles(files); }}
      />
    </section>
  );
}

function Shot({ img, index, count, cover, busy, onMove, onRemove }: {
  img: ProjectImage;
  index: number;
  count: number;
  cover: boolean;
  busy: boolean;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const portrait = img.height > img.width;
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <div className={`ph-tile relative w-full ${portrait ? 'aspect-[9/16]' : 'aspect-[16/10]'}`}>
        <img src={img.url} alt="" loading="lazy" />
        {cover && <span className="pill pill-accent absolute top-1.5 left-1.5 bg-bg/80"><IconStar size={10} /> Couv.</span>}
        <button type="button" aria-label={`Supprimer la photo ${index + 1}`} title="Supprimer" onClick={onRemove} disabled={busy} className="ph-btn top-1.5 right-1.5">
          <IconClose size={13} />
        </button>
      </div>
      <figcaption className="flex items-center justify-between">
        <span className="label num">{index + 1}</span>
        <span className="flex gap-1">
          <Button variant="plain" size="sm" icon aria-label={`Reculer la photo ${index + 1}`} disabled={index === 0 || busy} onClick={() => onMove(-1)}>‹</Button>
          <Button variant="plain" size="sm" icon aria-label={`Avancer la photo ${index + 1}`} disabled={index === count - 1 || busy} onClick={() => onMove(1)}>›</Button>
        </span>
      </figcaption>
    </figure>
  );
}
