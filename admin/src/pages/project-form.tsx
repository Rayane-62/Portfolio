import { useMutation, useQuery } from '@tanstack/react-query';
import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { IconClose, IconExternal, IconGithub, IconImage, IconLayers, IconStar, IconTrash } from '@/components/icons';
import { ProjectGallery } from '@/components/project-gallery';
import {
  Button, ErrorText, Field, LangNote, LangPicker, LoadError, Loading, PageHeader, SaveBar, Segmented, Spinner, SwitchRow, TechInput, TransField,
} from '@/components/ui';
import { api, errMsg, upload } from '@/lib/api';
import {
  CONTEXT_ORDER, LOCALES, locField, PROJECT_CATEGORIES, PROJECT_CONTEXT, PROJECT_ORDER, PROJECT_STATUS, STATUS_ORDER,
} from '@/lib/format';
import { keys, refresh } from '@/lib/queries';
import type { Locale, Project, ProjectCategory, ProjectContext, ProjectStatus } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

const FIELDS = ['title', 'summary', 'description', 'features', 'highlights'] as const;
type FieldKey = (typeof FIELDS)[number];
type Texts = Record<FieldKey, Record<Locale, string>>;

const TECH_SUGGESTIONS = ['React', 'Next.js', 'NestJS', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Kotlin', 'Angular'];
const MAX_IMAGE_MB = 15;

interface FormState {
  texts: Texts;
  categories: ProjectCategory[];
  status: ProjectStatus;
  /** 'none' = non précisé (null dans l'API). */
  context: ProjectContext | 'none';
  team: boolean;
  technologies: string[];
  imageUrl: string | null;
  imagePublicId: string | null;
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  visible: boolean;
}

const empty = (): FormState => ({
  texts: Object.fromEntries(FIELDS.map((f) => [f, { fr: '', en: '', es: '', ar: '' }])) as Texts,
  categories: ['web'],
  status: 'completed',
  context: 'none',
  team: false,
  technologies: [],
  imageUrl: null,
  imagePublicId: null,
  liveUrl: '',
  githubUrl: '',
  featured: false,
  visible: true,
});

const fromProject = (p: Project): FormState => ({
  texts: Object.fromEntries(
    FIELDS.map((f) => [f, Object.fromEntries(LOCALES.map((l) => [l, (p as unknown as Record<string, string | null>)[locField(f, l)] ?? ''])) as Record<Locale, string>]),
  ) as Texts,
  categories: p.categories,
  status: p.status,
  context: p.context ?? 'none',
  team: p.team,
  technologies: p.technologies,
  imageUrl: p.imageUrl,
  imagePublicId: p.imagePublicId,
  liveUrl: p.liveUrl ?? '',
  githubUrl: p.githubUrl ?? '',
  featured: p.featured,
  visible: p.visible,
});

export function ProjectFormPage() {
  const { id } = useParams();
  const editing = id ? Number(id) : null;
  const q = useQuery({
    queryKey: [...keys.projects, 'detail', editing ?? 0],
    queryFn: () => api<Project>(`/admin/projects/${editing}`),
    enabled: !!editing,
    staleTime: 0,
  });
  if (editing && q.isPending) return <Loading rows={5} />;
  if (editing && q.isError) return <LoadError error={q.error} retry={q.refetch} />;
  return <ProjectForm key={editing ?? 'new'} project={editing ? q.data! : null} />;
}

function ProjectForm({ project }: { project: Project | null }) {
  const navigate = useNavigate();
  const [loc, setLoc] = useState<Locale>('fr');
  const [start] = useState(() => (project ? fromProject(project) : empty()));
  const [f, setF] = useState<FormState>(start);
  const [initial, setInitial] = useState(() => JSON.stringify(start));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const leaving = useRef(false);
  const dirty = JSON.stringify(f) !== initial;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setError('');
  };
  const setText = (field: FieldKey) => (l: Locale, v: string) => {
    setF((s) => ({ ...s, texts: { ...s.texts, [field]: { ...s.texts[field], [l]: v } } }));
    setError('');
  };
  const filled = Object.fromEntries(
    LOCALES.map((l) => [l, l === 'fr' ? true : FIELDS.some((k) => f.texts[k][l].trim() !== '')]),
  ) as Record<Locale, boolean>;

  // ── Quitter avec des modifications : on demande confirmation ──
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({ title: 'Quitter sans enregistrer ?', message: 'Tes modifications sur ce projet seront perdues.', confirmLabel: 'Quitter', danger: true })
      .then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  // ── Image ──
  async function addFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('Choisis une image (JPG, PNG, WebP ou AVIF).', 'error');
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return toast(`${MAX_IMAGE_MB} Mo maximum`, 'error');
    setUploading(true);
    try {
      const img = await upload(file, 'project');
      setF((s) => ({ ...s, imageUrl: img.url, imagePublicId: img.publicId }));
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setUploading(false);
    }
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    addFile(e.dataTransfer.files[0]);
  }

  const save = useMutation({
    mutationFn: () => {
      const json: Record<string, unknown> = {
        categories: PROJECT_ORDER.filter((c) => f.categories.includes(c)),
        status: f.status,
        context: f.context === 'none' ? null : f.context,
        team: f.team,
        technologies: f.technologies,
        imageUrl: f.imageUrl,
        imagePublicId: f.imagePublicId,
        liveUrl: f.liveUrl.trim(),
        githubUrl: f.githubUrl.trim(),
        featured: f.featured,
        visible: f.visible,
      };
      for (const k of FIELDS) for (const l of LOCALES) json[locField(k, l)] = f.texts[k][l].trim();
      return project
        ? api<Project>(`/admin/projects/${project.id}`, { method: 'PATCH', json })
        : api<Project>('/admin/projects', { method: 'POST', json });
    },
    onSuccess: (p) => {
      refresh(keys.projects);
      toast(project ? 'Projet enregistré' : `« ${p.title} » ajouté`);
      leaving.current = true;
      setInitial(JSON.stringify(f));
      navigate('/projets');
    },
    onError: (e) => setError(errMsg(e)),
  });

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!f.texts.title.fr.trim()) { setLoc('fr'); return setError('Donne un titre au projet (en français).'); }
    if (!f.categories.length) return setError('Choisis au moins une catégorie (web, mobile ou logiciel).');
    for (const [k, label] of [['liveUrl', 'Le lien du site en ligne'], ['githubUrl', 'Le lien GitHub']] as const) {
      const v = f[k].trim();
      if (v && !/^https?:\/\//.test(v)) return setError(`${label} doit commencer par https://`);
    }
    save.mutate();
  }

  async function removeImage() {
    if (await confirm({ title: "Retirer l'image ?", message: "Elle sera supprimée du serveur à l'enregistrement.", confirmLabel: 'Retirer', danger: true })) {
      setF((s) => ({ ...s, imageUrl: null, imagePublicId: null }));
    }
  }

  const title = f.texts.title[loc].trim() || f.texts.title.fr.trim();

  return (
    <div>
      <PageHeader
        crumb={<Link to="/projets" className="hover:underline">← Projets</Link>}
        title={project ? f.texts.title.fr || 'Projet' : 'Nouveau projet'}
        action={project ? <span className="label self-center">Modifié le {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</span> : undefined}
      />

      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section className="panel flex flex-col gap-[18px]">
            <h2 className="panel-title m-0!">
              Textes
              <LangPicker value={loc} onChange={setLoc} filled={filled} />
            </h2>
            <LangNote loc={loc} />
            <TransField label="Titre" loc={loc} values={f.texts.title} onChange={setText('title')} maxLength={160} placeholder="Boutique CABA Beauty" />
            <TransField
              label="Résumé (carte)"
              loc={loc}
              values={f.texts.summary}
              onChange={setText('summary')}
              maxLength={400}
              rows={2}
              placeholder="Plateforme de livraison pour l'Algérie : 7 applications reliées à une API unique."
              hint="1 ou 2 phrases. Vide = le 1er paragraphe de la description."
            />
            <TransField
              label="Description complète"
              loc={loc}
              values={f.texts.description}
              onChange={setText('description')}
              maxLength={6000}
              rows={7}
              placeholder="Le problème, la solution, pour qui. Affichée dans la fenêtre du projet."
            />
            <TransField
              label="Fonctionnalités clés"
              loc={loc}
              values={f.texts.features}
              onChange={setText('features')}
              maxLength={4000}
              rows={6}
              placeholder={'Paiement à la livraison\nSuivi de commande en temps réel\n4 types de comptes'}
              hint="Une par ligne. Les tirets en début de ligne sont retirés."
            />
            <TransField
              label="Points forts techniques"
              loc={loc}
              values={f.texts.highlights}
              onChange={setText('highlights')}
              maxLength={4000}
              rows={4}
              placeholder={'Dispatch géolocalisé avec PostGIS\nMonorepo pnpm partagé entre 6 apps'}
              hint="Un par ligne. Ce qui impressionnerait un recruteur."
            />
          </section>

          <section className="panel flex flex-col gap-[18px]">
            <h2 className="panel-title m-0!">Nature du projet</h2>
            <Field label="Catégories" hint="Une ou plusieurs : un projet peut être à la fois web et mobile." as="div">
              <div className="seg" role="group" aria-label="Catégories du projet">
                {PROJECT_ORDER.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={f.categories.includes(c)}
                    onClick={() => set('categories', f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c])}
                  >
                    {PROJECT_CATEGORIES[c].label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Statut" hint={PROJECT_STATUS[f.status].hint} as="div">
              <Segmented value={f.status} onChange={(v) => set('status', v)} label="Statut du projet" options={STATUS_ORDER.map((st) => [st, PROJECT_STATUS[st].label])} />
            </Field>
            <Field label="Contexte" hint="Affiché en petit sur la fenêtre du projet. « Non précisé » = rien n'est affiché." as="div">
              <Segmented
                value={f.context}
                onChange={(v) => set('context', v)}
                label="Contexte du projet"
                options={[['none', 'Non précisé'], ...CONTEXT_ORDER.map((c) => [c, PROJECT_CONTEXT[c]] as [ProjectContext, string])]}
              />
            </Field>
            <SwitchRow label="Projet en équipe" hint="Ajoute le badge « Projet en équipe » sur la carte." checked={f.team} onChange={(v) => set('team', v)} />
            <Field label="Technologies" as="div">
              <TechInput value={f.technologies} onChange={(v) => set('technologies', v)} suggestions={TECH_SUGGESTIONS} />
            </Field>
          </section>

          <section className="panel flex flex-col gap-[18px]">
            <h2 className="panel-title m-0!">Couverture <span className="label">Facultatif</span></h2>
            {f.imageUrl ? (
              <div className="ph-tile aspect-[16/10] w-full max-w-[420px]">
                <img src={f.imageUrl} alt="" />
                <button type="button" aria-label="Retirer l'image" title="Retirer l'image" onClick={removeImage} className="ph-btn top-2 right-2">
                  <IconClose size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={onDrop}
                className={`drop ${over ? 'is-over' : ''} max-w-[420px]`}
              >
                {uploading ? <Spinner className="text-accent-2" /> : <IconImage size={24} className="text-accent-2" />}
                <b className="text-fg">{uploading ? 'Envoi en cours…' : 'Ajouter une capture'}</b>
                <span className="note">Glisse-dépose une image ou clique. JPG, PNG, WebP, AVIF — {MAX_IMAGE_MB} Mo max.</span>
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/png,image/webp,image/jpeg,image/avif" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; e.target.value = ''; addFile(file); }} />
            <p className="note m-0">Sans couverture, la carte affiche la 1<sup>re</sup> photo de la galerie. Les images sont redressées, réduites à 1600 px et converties en WebP par le serveur.</p>
          </section>

          <section className="panel flex flex-col gap-[18px]">
            <h2 className="panel-title m-0!">
              Galerie
              <span className="label">Langue des noms : {loc.toUpperCase()}</span>
            </h2>
            {project ? (
              <ProjectGallery projectId={project.id} loc={loc} coverChosen={!!f.imageUrl} />
            ) : (
              <p className="note m-0">Ajoute d'abord le projet : la galerie (parties et photos) se remplit ensuite, depuis cette page.</p>
            )}
          </section>

          <section className="panel grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <h2 className="panel-title col-span-full m-0!">Liens <span className="label">Vide = pas de bouton</span></h2>
            <Field label="Site en ligne">
              <input className="input" value={f.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder="https://caba-beauty.dz" inputMode="url" maxLength={1000} />
            </Field>
            <Field label="Dépôt GitHub">
              <input className="input" value={f.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} placeholder="https://github.com/Rayane-62/mon-projet" inputMode="url" maxLength={1000} />
            </Field>
          </section>

          <section className="panel">
            <h2 className="panel-title">Affichage</h2>
            <SwitchRow label="Mettre en avant" hint="Le projet remonte en haut de la section Projets du site." checked={f.featured} onChange={(v) => set('featured', v)} />
            <SwitchRow label="Afficher sur le site" hint="Décoche pour garder le projet ici sans le montrer." checked={f.visible} onChange={(v) => set('visible', v)} />
          </section>

          <ErrorText>{error}</ErrorText>

          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" loading={save.isPending} disabled={uploading}>{project ? 'Enregistrer' : 'Ajouter le projet'}</Button>
            <Link to="/projets" className="btn btn-ghost">Annuler</Link>
            {project && (
              <Button
                variant="bad"
                className="ml-auto"
                onClick={async () => {
                  if (await confirm({ title: 'Supprimer ce projet ?', message: `« ${project.title} », sa galerie et toutes ses photos seront définitivement supprimés.`, confirmLabel: 'Supprimer', danger: true })) {
                    try {
                      await api(`/admin/projects/${project.id}`, { method: 'DELETE' });
                      refresh(keys.projects);
                      toast('Projet supprimé');
                      leaving.current = true;
                      navigate('/projets');
                    } catch (e) {
                      setError(errMsg(e));
                    }
                  }
                }}
              >
                <IconTrash size={16} /> Supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Aperçu de la carte telle qu'elle apparaîtra sur le site */}
        <aside className="min-w-0 min-[1101px]:sticky min-[1101px]:top-5">
          <div className="label mb-2.5">Aperçu sur le site</div>
          <div className="overflow-hidden rounded-2xl border border-line bg-panel" dir={loc === 'ar' ? 'rtl' : undefined}>
            <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-sunk" style={{ background: 'radial-gradient(circle at 50% 35%, rgb(149 115 255 / 0.22), transparent 65%), #0e0620' }}>
              {f.imageUrl ? <img src={f.imageUrl} alt="" className="size-full object-cover" /> : <IconLayers size={30} className="text-line-2" />}
              {f.featured && <span className="pill pill-accent absolute top-2.5 left-2.5 bg-bg/70"><IconStar size={11} /> En avant</span>}
            </div>
            <div className={`flex flex-col gap-2 p-4 ${loc === 'ar' ? 'ar' : ''}`}>
              <span className="flex flex-wrap items-center gap-1.5">
                <span className={`pill ${PROJECT_STATUS[f.status].pill}`}>{PROJECT_STATUS[f.status].label}</span>
                {f.team && <span className="pill">Équipe</span>}
                <span className="label">{PROJECT_ORDER.filter((c) => f.categories.includes(c)).map((c) => PROJECT_CATEGORIES[c].label).join(' · ')}</span>
              </span>
              <b className="display text-[17px] break-words">{title || 'Titre du projet'}</b>
              <p className="m-0 line-clamp-3 text-[13px] leading-relaxed text-muted">
                {f.texts.summary[loc].trim() || f.texts.summary.fr.trim() || (f.texts.description[loc].trim() || f.texts.description.fr.trim()).split(/\n\s*\n/)[0] || 'Le résumé apparaîtra ici.'}
              </p>
              {f.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {f.technologies.slice(0, 5).map((t) => <span key={t} className="tech text-[11.5px]!">{t}</span>)}
                </div>
              )}
              <div className="mt-1 flex gap-2">
                {f.liveUrl.trim() && <span className="btn btn-sm pointer-events-none"><IconExternal size={14} /> Voir</span>}
                {f.githubUrl.trim() && <span className="btn btn-ghost btn-sm pointer-events-none"><IconGithub size={14} /> Code</span>}
              </div>
            </div>
          </div>
          {!f.visible && <p className="note mt-2">Projet masqué : il n'apparaîtra pas sur le site tant que l'interrupteur est éteint.</p>}
        </aside>
      </form>

      <SaveBar show={dirty} onCancel={() => { setF(JSON.parse(initial)); setError(''); }} onSave={() => submit()} saving={save.isPending} disabled={uploading} />
    </div>
  );
}
