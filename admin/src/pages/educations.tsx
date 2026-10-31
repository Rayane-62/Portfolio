import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { IconEdit, IconGraduation, IconPlus } from '@/components/icons';
import {
  Button, DeleteButton, Drawer, Empty, ErrorText, LangDots, LangNote, LangPicker, LoadError, Loading, OrderButtons, PageHeader, SwitchRow, TransField,
} from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { LOCALES, locField } from '@/lib/format';
import { keys, refresh, useEducations } from '@/lib/queries';
import { movedIds, useReorder } from '@/lib/reorder';
import type { Education, Locale } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

/** Les quatre textes d'un diplôme, chacun dans les 4 langues (la description est facultative). */
const FIELDS = ['degree', 'institution', 'period', 'description'] as const;
type FieldKey = (typeof FIELDS)[number];
type Texts = Record<FieldKey, Record<Locale, string>>;

const emptyTexts = (): Texts =>
  Object.fromEntries(FIELDS.map((f) => [f, { fr: '', en: '', es: '', ar: '' }])) as Texts;

function textsOf(e: Education): Texts {
  return Object.fromEntries(
    FIELDS.map((f) => [f, Object.fromEntries(LOCALES.map((l) => [l, (e as unknown as Record<string, string | null>)[locField(f, l)] ?? ''])) as Record<Locale, string>]),
  ) as Texts;
}

function filledLangs(t: Texts): Record<Locale, boolean> {
  return Object.fromEntries(LOCALES.map((l) => [l, l === 'fr' ? true : FIELDS.some((f) => t[f][l].trim() !== '')])) as Record<Locale, boolean>;
}

export function EducationsPage() {
  const [edit, setEdit] = useState<Education | 'new' | null>(null);
  const q = useEducations();
  const list = q.data ?? [];
  const reorder = useReorder<Education>('educations', keys.educations);
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/educations/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refresh(keys.educations); toast('Diplôme supprimé'); },
    onError: (e) => toast(errMsg(e), 'error'),
  });

  async function askDelete(e: Education) {
    if (await confirm({ title: 'Supprimer ce diplôme ?', message: `« ${e.degree} — ${e.institution} » disparaîtra de la section Formation du site.`, confirmLabel: 'Supprimer', danger: true })) del.mutate(e.id);
  }

  return (
    <div>
      <PageHeader
        crumb="Mes études"
        title="Formation"
        action={<Button onClick={() => setEdit('new')}><IconPlus size={18} /> Nouveau diplôme</Button>}
      />
      <p className="note mb-4 max-w-[70ch]">Même principe que l'expérience : l'ordre ci-dessous est celui du site, et le français sert de secours quand une traduction manque.</p>

      {q.isPending ? <Loading rows={2} /> : q.isError ? <LoadError error={q.error} retry={q.refetch} /> : list.length === 0 ? (
        <Empty title="Aucun diplôme" icon={<IconGraduation size={22} />}>
          Ajoute ton premier diplôme ou ta formation en cours.
          <Button onClick={() => setEdit('new')}><IconPlus size={18} /> Nouveau diplôme</Button>
        </Empty>
      ) : (
        <div className="reveal flex flex-col gap-3.5">
          {list.map((e, i) => {
            const langs = filledLangs(textsOf(e));
            return (
              <article key={e.id} className="panel flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="display m-0 text-[19px] break-words">{e.degree}</h2>
                    <p className="m-0 text-sm text-soft">
                      {e.institution} <span className="text-muted">· {e.period}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {e.current && <span className="pill pill-cyan"><i />En cours</span>}
                    <OrderButtons index={i} count={list.length} busy={reorder.isPending} name={e.degree} onMove={(d) => { const ids = movedIds(list.map((x) => x.id), e.id, d); if (ids) reorder.mutate(ids); }} />
                  </div>
                </div>

                {e.description && <p className="m-0 text-sm leading-relaxed text-soft">{e.description}</p>}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <LangDots filled={langs} />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEdit(e)}><IconEdit size={15} /> Modifier</Button>
                    <DeleteButton onClick={() => askDelete(e)} label={`Supprimer ${e.degree}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {edit && <EducationDrawer education={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function EducationDrawer({ education, onClose }: { education: Education | null; onClose: () => void }) {
  const [loc, setLoc] = useState<Locale>('fr');
  const [texts, setTexts] = useState<Texts>(() => (education ? textsOf(education) : emptyTexts()));
  const [current, setCurrent] = useState(education?.current ?? false);
  const [error, setError] = useState('');

  const set = (f: FieldKey) => (l: Locale, v: string) => {
    setTexts((s) => ({ ...s, [f]: { ...s[f], [l]: v } }));
    setError('');
  };

  const save = useMutation({
    mutationFn: () => {
      const json: Record<string, unknown> = { current };
      for (const f of FIELDS) for (const l of LOCALES) json[locField(f, l)] = texts[f][l].trim();
      return education
        ? api<Education>(`/admin/educations/${education.id}`, { method: 'PATCH', json })
        : api<Education>('/admin/educations', { method: 'POST', json });
    },
    onSuccess: () => {
      refresh(keys.educations);
      toast(education ? 'Diplôme modifié' : 'Diplôme ajouté');
      onClose();
    },
    onError: (e) => setError(errMsg(e)),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!texts.degree.fr.trim()) { setLoc('fr'); return setError('Indique le diplôme en français.'); }
    if (!texts.institution.fr.trim()) { setLoc('fr'); return setError("Indique l'établissement en français."); }
    if (!texts.period.fr.trim()) { setLoc('fr'); return setError('Indique la période en français.'); }
    save.mutate();
  }

  return (
    <Drawer
      title={education ? `Modifier ${education.degree}` : 'Nouveau diplôme'}
      onClose={onClose}
      header={
        <>
          <span className="label block">{education ? 'Modifier' : 'Ajouter'}</span>
          <b className="display block text-xl break-words">{texts.degree.fr || 'Nouveau diplôme'}</b>
        </>
      }
      footer={
        <>
          <Button onClick={submit} loading={save.isPending}>{education ? 'Enregistrer' : 'Ajouter'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
        <div className="flex flex-col gap-2">
          <LangPicker value={loc} onChange={setLoc} filled={filledLangs(texts)} />
          <LangNote loc={loc} />
        </div>

        <TransField label="Diplôme" loc={loc} values={texts.degree} onChange={set('degree')} maxLength={200} placeholder="Master Ingénierie du Logiciel" />
        <TransField label="Établissement" loc={loc} values={texts.institution} onChange={set('institution')} maxLength={200} placeholder="USTHB — Alger" />
        <TransField label="Période" loc={loc} values={texts.period} onChange={set('period')} maxLength={120} placeholder="2025 → 2026" hint="Texte libre, comme sur un CV." />
        <TransField label="Description" loc={loc} values={texts.description} onChange={set('description')} maxLength={2000} rows={4} placeholder="Facultatif : spécialité, mention, projets marquants." hint="Laisse vide et rien ne s'affiche sous le diplôme." />

        <section className="panel p-0! px-4!">
          <SwitchRow label="Diplôme en cours" hint="Affiche le badge « En cours » sur le site." checked={current} onChange={setCurrent} />
        </section>

        <ErrorText>{error}</ErrorText>
      </form>
    </Drawer>
  );
}
