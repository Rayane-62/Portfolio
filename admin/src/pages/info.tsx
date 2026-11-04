import { useMutation } from '@tanstack/react-query';
import { type ChangeEvent, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { IconExternal, IconFile, IconImage, IconTrash, IconUser, SocialIcon } from '@/components/icons';
import {
  Button, ErrorText, Field, Help, LangNote, LangPicker, LoadError, Loading, PageHeader, SaveBar, Spinner, SwitchRow, TransField,
} from '@/components/ui';
import { api, errMsg, upload } from '@/lib/api';
import { badHandle, LANGS, LOCALES, locField, SOCIALS, socialUrl, waLink } from '@/lib/format';
import { keys, queryClient, useInfo } from '@/lib/queries';
import type { Info, Locale, SocialKey } from '@/lib/types';
import { confirm, toast } from '@/store/ui';

type Tab = 'identite' | 'contact' | 'chiffres' | 'reseaux';
const TABS: [Tab, string][] = [
  ['identite', 'Identité'],
  ['contact', 'Contact'],
  ['chiffres', 'Chiffres'],
  ['reseaux', 'Réseaux'],
];

const TEXT_FIELDS = ['title', 'bio'] as const;
type TextKey = (typeof TEXT_FIELDS)[number];
type Texts = Record<TextKey, Record<Locale, string>>;

interface Draft {
  name: string;
  nameAr: string;
  texts: Texts;
  photoUrl: string | null;
  photoPublicId: string | null;
  cvUrl: string | null;
  cvPublicId: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  available: boolean;
  statsProjects: string;
  statsExperience: string;
  statsClients: string;
  socials: Record<SocialKey, string>;
}

const toDraft = (i: Info): Draft => ({
  name: i.name,
  nameAr: i.nameAr ?? '',
  texts: Object.fromEntries(
    TEXT_FIELDS.map((f) => [f, Object.fromEntries(LOCALES.map((l) => [l, (i as unknown as Record<string, string | null>)[locField(f, l)] ?? ''])) as Record<Locale, string>]),
  ) as Texts,
  photoUrl: i.photoUrl,
  photoPublicId: i.photoPublicId,
  cvUrl: i.cvUrl,
  cvPublicId: i.cvPublicId,
  email: i.email,
  phone: i.phone,
  whatsapp: i.whatsapp,
  available: i.available,
  statsProjects: String(i.statsProjects),
  statsExperience: String(i.statsExperience),
  statsClients: String(i.statsClients),
  socials: Object.fromEntries(SOCIALS.map(({ key }) => [key, i[key] ?? ''])) as Record<SocialKey, string>,
});

export function InfoPage() {
  const q = useInfo();
  const [version, setVersion] = useState(0);
  if (q.isPending) return <Loading rows={3} />;
  if (q.isError) return <LoadError error={q.error} retry={q.refetch} />;
  // Après « Enregistrer », le formulaire repart des valeurs enregistrées. Un rechargement en arrière-plan
  // (mise à jour en direct, retour sur l'onglet) ne le remet pas à zéro : les modifications en cours sont gardées.
  return <InfoForm key={version} info={q.data} onSaved={() => setVersion((v) => v + 1)} />;
}

function InfoForm({ info, onSaved }: { info: Info; onSaved: () => void }) {
  const [sp, setSp] = useSearchParams();
  const rawTab = sp.get('onglet');
  const tab: Tab = TABS.some(([k]) => k === rawTab) ? (rawTab as Tab) : 'identite';
  const [loc, setLoc] = useState<Locale>('fr');
  const [d, setD] = useState<Draft>(() => toDraft(info));
  const [initial, setInitial] = useState(() => JSON.stringify(toDraft(info)));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'photo' | 'cv' | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== initial;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((s) => ({ ...s, [k]: v })); setError(''); };
  const setText = (f: TextKey) => (l: Locale, v: string) => {
    setD((s) => ({ ...s, texts: { ...s.texts, [f]: { ...s.texts[f], [l]: v } } }));
    setError('');
  };
  const field = (k: 'name' | 'nameAr' | 'email' | 'phone' | 'whatsapp' | 'statsProjects' | 'statsExperience' | 'statsClients') => ({
    value: d[k],
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
  });
  const filled = Object.fromEntries(
    LOCALES.map((l) => [l, l === 'fr' ? true : l === 'ar' ? d.nameAr.trim() !== '' || TEXT_FIELDS.some((f) => d.texts[f].ar.trim() !== '') : TEXT_FIELDS.some((f) => d.texts[f][l].trim() !== '')]),
  ) as Record<Locale, boolean>;

  const save = useMutation({
    mutationFn: () => {
      const json: Record<string, unknown> = {
        name: d.name.trim(),
        nameAr: d.nameAr.trim(),
        photoUrl: d.photoUrl,
        photoPublicId: d.photoPublicId,
        cvUrl: d.cvUrl,
        cvPublicId: d.cvPublicId,
        email: d.email.trim(),
        phone: d.phone.trim(),
        whatsapp: d.whatsapp.trim(),
        available: d.available,
        statsProjects: Number(d.statsProjects || 0),
        statsExperience: Number(d.statsExperience || 0),
        statsClients: Number(d.statsClients || 0),
        ...Object.fromEntries(SOCIALS.map(({ key }) => [key, d.socials[key].trim()])),
      };
      for (const f of TEXT_FIELDS) for (const l of LOCALES) json[locField(f, l)] = d.texts[f][l].trim();
      return api<Info>('/admin/info', { method: 'PATCH', json });
    },
    onSuccess: (i) => { queryClient.setQueryData(keys.info, i); queryClient.invalidateQueries({ queryKey: keys.dashboard }); toast('Profil enregistré — le site est à jour'); onSaved(); },
    onError: (e) => setError(errMsg(e)),
  });

  function submit() {
    if (!d.name.trim()) { setSp({ onglet: 'identite' }, { replace: true }); return setError('Le nom est obligatoire.'); }
    if (!d.texts.title.fr.trim()) { setSp({ onglet: 'identite' }, { replace: true }); setLoc('fr'); return setError('Le titre en français est obligatoire.'); }
    for (const k of ['statsProjects', 'statsExperience', 'statsClients'] as const) {
      if (d[k] !== '' && !/^\d+$/.test(d[k])) { setSp({ onglet: 'chiffres' }, { replace: true }); return setError('Les chiffres doivent être des nombres entiers positifs.'); }
    }
    save.mutate();
  }

  /**
   * Photo et CV sont enregistrés tout de suite, sans attendre « Enregistrer » :
   * le reste du formulaire (même modifié) n'est pas touché.
   */
  type FilePatch = Partial<Pick<Draft, 'photoUrl' | 'photoPublicId' | 'cvUrl' | 'cvPublicId'>>;
  async function saveFiles(patch: FilePatch, message: string) {
    await api<Info>('/admin/info', { method: 'PATCH', json: patch });
    setD((s) => ({ ...s, ...patch }));
    setInitial((prev) => JSON.stringify({ ...JSON.parse(prev), ...patch }));
    // Même date de modification : le formulaire n'est pas rechargé, les autres champs en cours sont gardés.
    queryClient.setQueryData<Info>(keys.info, (old) => (old ? { ...old, ...patch } : old));
    queryClient.invalidateQueries({ queryKey: keys.dashboard });
    toast(message);
  }
  async function removeFile(kind: 'photo' | 'cv') {
    const ok = await confirm(
      kind === 'photo'
        ? { title: 'Supprimer la photo ?', message: 'Le site affichera un bloc vide à la place de ton portrait.', confirmLabel: 'Supprimer', danger: true }
        : { title: 'Supprimer le CV ?', message: 'Le bouton « Télécharger mon CV » disparaîtra du site.', confirmLabel: 'Supprimer', danger: true },
    );
    if (!ok) return;
    setBusy(kind);
    try {
      await saveFiles(
        kind === 'photo' ? { photoUrl: null, photoPublicId: null } : { cvUrl: null, cvPublicId: null },
        kind === 'photo' ? 'Photo supprimée' : 'CV supprimé',
      );
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function sendPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('photo');
    try {
      const r = await upload(file, 'photo');
      await saveFiles({ photoUrl: r.url, photoPublicId: r.publicId }, 'Photo enregistrée — le site est à jour');
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(null);
    }
  }
  async function sendCv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return toast('Le CV doit être un fichier PDF.', 'error');
    setBusy('cv');
    try {
      const r = await upload(file, 'cv');
      await saveFiles({ cvUrl: r.url, cvPublicId: r.publicId }, 'CV enregistré — le site est à jour');
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(null);
    }
  }

  const rtl = loc === 'ar';
  const shownName = rtl && d.nameAr.trim() ? d.nameAr.trim() : d.name.trim();
  const shownTitle = d.texts.title[loc].trim() || d.texts.title.fr.trim();
  const shownBio = d.texts.bio[loc].trim() || d.texts.bio.fr.trim();

  return (
    <div>
      <PageHeader crumb="Ce que le site raconte de toi" title="Mon profil" />

      <div className="tabs mb-[18px]" role="tablist" aria-label="Sections du profil">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setSp(k === 'identite' ? {} : { onglet: k }, { replace: true })}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <div key={tab} className="reveal flex min-w-0 flex-col gap-[18px]">
          {tab === 'identite' && (
            <>
              <section className="panel">
                <h2 className="panel-title">Photo & CV <span className="label">Enregistrés dès l'envoi</span></h2>
                <div className="grid grid-cols-2 gap-[18px] max-md:grid-cols-1">
                  <div className="flex items-start gap-3.5">
                    {d.photoUrl ? (
                      <div className="ph-tile size-[104px] shrink-0"><img src={d.photoUrl} alt="Ta photo" /></div>
                    ) : (
                      <button type="button" onClick={() => photoInput.current?.click()} className="drop size-[104px] shrink-0 p-2! text-xs">
                        {busy === 'photo' ? <Spinner className="text-accent-2" /> : <IconImage size={22} className="text-accent-2" />}
                      </button>
                    )}
                    <div className="flex min-w-0 flex-col gap-2">
                      <b className="text-sm">Photo de profil</b>
                      <span className="note">Portrait net, de face. JPG, PNG, WebP — 15 Mo max.</span>
                      <span className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => photoInput.current?.click()} loading={busy === 'photo'}>
                          <IconImage size={15} /> {d.photoUrl ? 'Changer' : 'Ajouter'}
                        </Button>
                        {d.photoUrl && (
                          <Button size="sm" variant="bad" onClick={() => removeFile('photo')} disabled={busy !== null}>
                            <IconTrash size={15} /> Supprimer
                          </Button>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="grid size-[104px] shrink-0 place-items-center rounded-xl border border-line-2 bg-sunk text-accent-3">
                      {busy === 'cv' ? <Spinner /> : <IconFile size={28} />}
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <b className="text-sm">CV (PDF)</b>
                      {d.cvUrl ? (
                        <a href={d.cvUrl} target="_blank" rel="noopener" className="note truncate text-accent-3! hover:underline">Ouvrir le CV en ligne</a>
                      ) : (
                        <span className="note">Sans CV, le bouton « Télécharger mon CV » n'apparaît pas. PDF, 10 Mo max.</span>
                      )}
                      <span className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => cvInput.current?.click()} loading={busy === 'cv'}>
                          <IconFile size={15} /> {d.cvUrl ? 'Changer' : 'Ajouter'}
                        </Button>
                        {d.cvUrl && (
                          <Button size="sm" variant="bad" onClick={() => removeFile('cv')} disabled={busy !== null}>
                            <IconTrash size={15} /> Supprimer
                          </Button>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <input ref={photoInput} type="file" accept="image/png,image/webp,image/jpeg,image/avif" hidden onChange={sendPhoto} />
                <input ref={cvInput} type="file" accept="application/pdf" hidden onChange={sendCv} />
              </section>
              <section className="panel flex flex-col gap-[18px]">
                <h2 className="panel-title m-0!">
                  Identité
                  <LangPicker value={loc} onChange={setLoc} filled={filled} />
                </h2>
                <LangNote loc={loc} />
                <Field label="Nom complet" hint="Le même dans toutes les langues (en lettres latines).">
                  <input className="input" {...field('name')} maxLength={120} />
                </Field>
                {rtl && (
                  <Field label={<>Nom en arabe <span className="text-accent-3">· AR</span> · facultatif</>} hint="Affiché à la place du nom latin, seulement sur la version arabe du site.">
                    <input className="input ar" dir="rtl" {...field('nameAr')} maxLength={120} placeholder="بن لعلام محمد ريان" />
                  </Field>
                )}
                <TransField label="Titre" loc={loc} values={d.texts.title} onChange={setText('title')} maxLength={160} placeholder="Développeur Full Stack" />
                <TransField label="Biographie" loc={loc} values={d.texts.bio} onChange={setText('bio')} maxLength={4000} rows={7} placeholder="Deux ou trois phrases : qui tu es, ce que tu construis, pour qui." />
              </section>
              <section className="panel">
                <h2 className="panel-title">Les 4 langues</h2>
                <p className="note m-0">
                  Le site existe en français, anglais, espagnol et arabe. Seul le <b className="text-fg">français est obligatoire</b> :
                  une traduction laissée vide est remplacée par le texte français, le site n'a jamais de trou.
                  Les points verts du sélecteur de langue indiquent les langues déjà remplies.
                </p>
              </section>
            </>
          )}

          {tab === 'contact' && (
            <>
              <section className="panel grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
                <h2 className="panel-title col-span-full m-0!">Comment te joindre</h2>
                <Field label="E-mail" hint="Reçoit les réponses au formulaire de contact." className="col-span-full">
                  <input className="input" type="email" {...field('email')} maxLength={160} placeholder="prenom.nom@gmail.com" />
                </Field>
                <Field label="Téléphone">
                  <input className="input num" {...field('phone')} inputMode="tel" maxLength={30} placeholder="+213 549 10 72 47" />
                </Field>
                <Field label="WhatsApp" hint={d.whatsapp.trim() ? <>Lien du site : <a href={waLink(d.whatsapp)} target="_blank" rel="noopener" className="text-accent-3 hover:underline">{waLink(d.whatsapp)}</a></> : 'Le bouton WhatsApp du site utilise ce numéro.'}>
                  <input className="input num" {...field('whatsapp')} inputMode="tel" maxLength={30} placeholder="+213 549 10 72 47" />
                </Field>
              </section>
              <section className="panel">
                <h2 className="panel-title">Disponibilité</h2>
                <SwitchRow
                  label="Je suis disponible pour de nouveaux projets"
                  hint={d.available ? 'Le site affiche un badge vert « Disponible ».' : 'Le site affiche « Pas disponible en ce moment ».'}
                  checked={d.available}
                  onChange={(v) => set('available', v)}
                />
              </section>
            </>
          )}

          {tab === 'chiffres' && (
            <section className="panel grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
              <h2 className="panel-title col-span-full m-0!">Les trois chiffres de l'accueil</h2>
              <Field label="Projets livrés"><input className="input num" {...field('statsProjects')} inputMode="numeric" maxLength={4} /></Field>
              <Field label="Années d'expérience"><input className="input num" {...field('statsExperience')} inputMode="numeric" maxLength={4} /></Field>
              <Field label="Clients"><input className="input num" {...field('statsClients')} inputMode="numeric" maxLength={4} /></Field>
              <p className="note col-span-full m-0">
                Ce sont les compteurs affichés en haut du site. Ils sont écrits à la main : ils ne se calculent pas tout seuls
                à partir de la liste des projets, donc pense à les mettre à jour quand tu livres quelque chose.
              </p>
            </section>
          )}

          {tab === 'reseaux' && (
            <section className="panel flex flex-col gap-3.5">
              <h2 className="panel-title m-0!">Réseaux sociaux <span className="label">Les 8 sont facultatifs</span></h2>
              <Help title="Comment ça marche ?">
                Un champ <b>vide</b> ne s'affiche pas sur le site : aucun bouton, aucune icône. Remplis seulement ceux que tu utilises.
                <br />Tu peux coller ce que tu veux — <code>https://github.com/Rayane-62</code>, <code>@Rayane-62</code> ou <code>Rayane-62</code> :
                l'API ne garde que le pseudo et reconstruit le lien complet pour le site.
                <br />Attention : un pseudo avec un <b>espace</b> donne un lien cassé (c'est le cas du LinkedIn repris de l'ancien site).
              </Help>
              <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
                {SOCIALS.map(({ key, label, placeholder, base }) => {
                  const v = d.socials[key].trim();
                  const bad = badHandle(v);
                  return (
                    <Field
                      key={key}
                      label={<span className="flex items-center gap-1.5"><SocialIcon network={key} size={13} /> {label}</span>}
                      error={bad ? "Un pseudo ne contient pas d'espace : colle l'adresse complète de ton profil." : undefined}
                      hint={
                        v && !bad
                          ? <a href={socialUrl(key, v)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-accent-3 hover:underline"><IconExternal size={12} /> {socialUrl(key, v)}</a>
                          : v
                            ? undefined
                            : 'Vide : rien sur le site.'
                      }
                    >
                      <div className="flex items-center gap-0">
                        <span className="label hidden w-[118px] shrink-0 truncate pr-2 text-right text-[9.5px]! tracking-[0.04em]! normal-case sm:block" title={base}>{base}</span>
                        <input
                          className={`input ${bad ? 'is-bad' : ''}`}
                          value={d.socials[key]}
                          onChange={(e) => set('socials', { ...d.socials, [key]: e.target.value })}
                          placeholder={placeholder}
                          maxLength={200}
                        />
                      </div>
                    </Field>
                  );
                })}
              </div>
            </section>
          )}



          <ErrorText>{error}</ErrorText>
        </div>

        {/* Aperçu du haut du site */}
        <aside className="min-w-0 min-[1101px]:sticky min-[1101px]:top-5">
          <div className="label mb-2.5">Aperçu · {LANGS[loc].name}</div>
          <div className="overflow-hidden rounded-2xl border border-line bg-panel" dir={rtl ? 'rtl' : undefined}>
            <div className="relative p-5" style={{ background: 'radial-gradient(90% 70% at 50% 0%, rgb(149 115 255 / 0.2), transparent 60%)' }}>
              <div className={`flex items-center gap-3 ${rtl ? 'ar' : ''}`}>
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line-2 bg-sunk text-line-2">
                  {d.photoUrl ? <img src={d.photoUrl} alt="" className="size-full object-cover" /> : <IconUser size={24} />}
                </span>
                <span className="min-w-0">
                  <b className="display block truncate text-[17px]">{shownName || 'Ton nom'}</b>
                  <span className="label block truncate normal-case text-accent-3!">{shownTitle || 'Ton titre'}</span>
                </span>
              </div>
              <p className={`m-0 mt-3 line-clamp-4 text-[13px] leading-relaxed text-muted ${rtl ? 'ar' : ''}`}>{shownBio || 'Ta biographie apparaîtra ici.'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`pill ${d.available ? 'pill-ok' : 'pill-off'}`}><i />{d.available ? 'Disponible' : 'Indisponible'}</span>
                {d.cvUrl && <span className="pill pill-cyan">CV</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-line">
              {[[d.statsProjects, 'Projets'], [d.statsExperience, 'Années'], [d.statsClients, 'Clients']].map(([n, l]) => (
                <div key={l} className="border-l border-line px-3 py-3 text-center first:border-l-0">
                  <b className="display block text-xl">{n || '0'}</b>
                  <span className="label text-[9px]!">{l}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line p-3">
              {SOCIALS.filter(({ key }) => d.socials[key].trim()).map(({ key, label }) => (
                <span key={key} title={label} className="grid size-9 place-items-center rounded-xl border border-line text-muted">
                  <SocialIcon network={key} size={16} />
                </span>
              ))}
              {SOCIALS.every(({ key }) => !d.socials[key].trim()) && <span className="note">Aucun réseau : aucune icône sur le site.</span>}
            </div>
          </div>
        </aside>
      </div>

      <SaveBar show={dirty} onCancel={() => { setD(JSON.parse(initial)); setError(''); }} onSave={submit} saving={save.isPending} disabled={busy !== null} />
    </div>
  );
}
