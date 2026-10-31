import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { IconBriefcase, IconEdit, IconPlus } from '@/components/icons';
import {
  Button, DeleteButton, Drawer, Empty, ErrorText, Field, LangDots, LangNote, LangPicker, LoadError, Loading, OrderButtons, PageHeader, SwitchRow, TechInput, TransField,
} from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { LOCALES, locField } from '@/lib/format';
import { keys, refresh, useExperiences } from '@/lib/queries';
import { movedIds, useReorder } from '@/lib/reorder';
import type { Experience, Locale } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

/** Les quatre textes d'une expérience, chacun dans les 4 langues. */
const FIELDS = ['position', 'company', 'period', 'description'] as const;
type FieldKey = (typeof FIELDS)[number];
type Texts = Record<FieldKey, Record<Locale, string>>;

const TECH_SUGGESTIONS = ['React', 'Next.js', 'NestJS', 'Angular', 'Kotlin', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'];

const emptyTexts = (): Texts =>
  Object.fromEntries(FIELDS.map((f) => [f, { fr: '', en: '', es: '', ar: '' }])) as Texts;

function textsOf(e: Experience): Texts {
  return Object.fromEntries(
    FIELDS.map((f) => [f, Object.fromEntries(LOCALES.map((l) => [l, (e as unknown as Record<string, string | null>)[locField(f, l)] ?? ''])) as Record<Locale, string>]),
  ) as Texts;
}

/** Une langue est « remplie » dès qu'un de ses textes est écrit (le français l'est toujours). */
function filledLangs(t: Texts): Record<Locale, boolean> {
  return Object.fromEntries(LOCALES.map((l) => [l, l === 'fr' ? true : FIELDS.some((f) => t[f][l].trim() !== '')])) as Record<Locale, boolean>;
}

export function ExperiencesPage() {
  const [edit, setEdit] = useState<Experience | 'new' | null>(null);
  const q = useExperiences();
  const list = q.data ?? [];
  const reorder = useReorder<Experience>('experiences', keys.experiences);
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/experiences/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refresh(keys.experiences); toast('Expérience supprimée'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  async function askDelete(e: Experience) {
    if (await confirm({ title: 'Supprimer cette expérience ?', message: `« ${e.position} — ${e.company} » disparaîtra de ton parcours sur le site.`, confirmLabel: 'Supprimer', danger: true })) del.mutate(e.id);
  }

  return (
    <div>
      <PageHeader
        crumb="Mon parcours"
        title="Expérience"
        action={<Button onClick={() => setEdit('new')}><IconPlus size={18} /> Nouvelle expérience</Button>}
      />
      <p className="note mb-4 max-w-[70ch]">L'ordre ci-dessous est celui du site, de haut en bas. Chaque texte peut être traduit en anglais, espagnol et arabe ; sans traduction, le français est affiché.</p>

      {q.isPending ? <Loading rows={2} /> : q.isError ? <LoadError error={q.error} retry={q.refetch} /> : list.length === 0 ? (
        <Empty title="Aucune expérience" icon={<IconBriefcase size={22} />}>
          Ajoute ton premier poste (entreprise, période, missions).
          <Button onClick={() => setEdit('new')}><IconPlus size={18} /> Nouvelle expérience</Button>
        </Empty>
      ) : (
        <div className="reveal flex flex-col gap-3.5">
          {list.map((e, i) => {
            const langs = filledLangs(textsOf(e));
            return (
              <article key={e.id} className="panel flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="display m-0 text-[19px] break-words">{e.position}</h2>
                    <p className="m-0 text-sm text-soft">
                      {e.company} <span className="text-muted">· {e.period}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {e.current && <span className="pill pill-ok"><i />Actuel</span>}
                    <OrderButtons index={i} count={list.length} busy={reorder.isPending} name={e.position} onMove={(d) => { const ids = movedIds(list.map((x) => x.id), e.id, d); if (ids) reorder.mutate(ids); }} />
                  </div>
                </div>

                {e.description && <p className="m-0 text-sm leading-relaxed text-soft">{e.description}</p>}

                {e.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {e.technologies.map((t) => <span key={t} className="tech">{t}</span>)}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <LangDots filled={langs} />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEdit(e)}><IconEdit size={15} /> Modifier</Button>
                    <DeleteButton onClick={() => askDelete(e)} label={`Supprimer ${e.position}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {edit && <ExperienceDrawer experience={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function ExperienceDrawer({ experience, onClose }: { experience: Experience | null; onClose: () => void }) {
  const [loc, setLoc] = useState<Locale>('fr');
  const [texts, setTexts] = useState<Texts>(() => (experience ? textsOf(experience) : emptyTexts()));
  const [technologies, setTechnologies] = useState<string[]>(experience?.technologies ?? []);
  const [current, setCurrent] = useState(experience?.current ?? false);
  const [error, setError] = useState('');

  const set = (f: FieldKey) => (l: Locale, v: string) => {
    setTexts((s) => ({ ...s, [f]: { ...s[f], [l]: v } }));
    setError('');
  };

  const save = useMutation({
    mutationFn: () => {
      const json: Record<string, unknown> = { technologies, current };
      for (const f of FIELDS) for (const l of LOCALES) json[locField(f, l)] = texts[f][l].trim();
      return experience
        ? api<Experience>(`/admin/experiences/${experience.id}`, { method: 'PATCH', json })
        : api<Experience>('/admin/experiences', { method: 'POST', json });
    },
    onSuccess: () => {
      refresh(keys.experiences);
      toast(experience ? 'Expérience modifiée' : 'Expérience ajoutée');
      onClose();
    },
    onError: (e) => setError(errMsg(e)),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!texts.position.fr.trim()) { setLoc('fr'); return setError('Indique le poste en français.'); }
    if (!texts.company.fr.trim()) { setLoc('fr'); return setError("Indique l'entreprise en français."); }
    if (!texts.period.fr.trim()) { setLoc('fr'); return setError('Indique la période en français.'); }
    save.mutate();
  }

  return (
    <Drawer
      title={experience ? `Modifier ${experience.position}` : 'Nouvelle expérience'}
      onClose={onClose}
      header={
        <>
          <span className="label block">{experience ? 'Modifier' : 'Ajouter'}</span>
          <b className="display block text-xl break-words">{texts.position.fr || 'Nouvelle expérience'}</b>
        </>
      }
      footer={
        <>
          <Button onClick={submit} loading={save.isPending}>{experience ? 'Enregistrer' : 'Ajouter'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
        <div className="flex flex-col gap-2">
          <LangPicker value={loc} onChange={setLoc} filled={filledLangs(texts)} />
          <LangNote loc={loc} />
        </div>

        <TransField label="Poste" loc={loc} values={texts.position} onChange={set('position')} maxLength={160} placeholder="Développeur Web Full Stack" />
        <TransField label="Entreprise" loc={loc} values={texts.company} onChange={set('company')} maxLength={160} placeholder="Freelance" />
        <TransField label="Période" loc={loc} values={texts.period} onChange={set('period')} maxLength={120} placeholder="Juin 2025 → Présent" hint="Écris-la comme tu veux : c'est du texte libre." />
        <TransField label="Description" loc={loc} values={texts.description} onChange={set('description')} maxLength={2000} rows={5} placeholder="Ce que tu as fait, pour qui, avec quels résultats." />

        <Field label="Technologies" as="div">
          <TechInput value={technologies} onChange={setTechnologies} suggestions={TECH_SUGGESTIONS} />
        </Field>

        <section className="panel p-0! px-4!">
          <SwitchRow label="Poste en cours" hint="Affiche le badge « Actuel » sur le site." checked={current} onChange={setCurrent} />
        </section>

        <ErrorText>{error}</ErrorText>
      </form>
    </Drawer>
  );
}
