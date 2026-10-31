import { type ButtonHTMLAttributes, type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconAlert, IconBolt, IconCheck, IconClose, IconHelp, IconPlus, IconTrash } from '@/components/icons';
import { LANGS, LOCALES } from '@/lib/format';
import type { Locale } from '@/lib/types';
import { useUi } from '@/store/ui';

// ─── Boutons ────────────────────────────────────────────────────────────────

type Variant = 'accent' | 'ghost' | 'bad' | 'danger' | 'plain';
const VARIANTS: Record<Variant, string> = { accent: '', ghost: 'btn-ghost', bad: 'btn-bad', danger: 'btn-danger', plain: 'btn-plain' };

export function Button({
  variant = 'accent',
  size = 'md',
  icon,
  className = '',
  loading,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: boolean; loading?: boolean }) {
  const s = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md';
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={`btn ${s} ${VARIANTS[variant]} ${icon ? 'btn-icon' : ''} ${className}`}
    >
      {loading ? <Spinner /> : null}
      {loading && icon ? null : children}
    </button>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

// ─── Formulaires ────────────────────────────────────────────────────────────

/**
 * Champ avec étiquette mono. `as="div"` quand il contient plusieurs contrôles.
 * L'aide et l'erreur sont volontairement **hors** du `<label>` : le nom du champ lu par
 * un lecteur d'écran reste l'étiquette seule.
 */
export function Field({ label, hint, error, className = '', as = 'label', children }: { label: ReactNode; hint?: ReactNode; error?: string; className?: string; as?: 'label' | 'div'; children: ReactNode }) {
  const inner = (
    <>
      <span className="label">{label}</span>
      {children}
    </>
  );
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {as === 'label' ? <label className="flex min-w-0 flex-col gap-1.5">{inner}</label> : inner}
      {hint && <span className="note">{hint}</span>}
      {error && <span className="text-[12.5px] font-semibold text-bad">{error}</span>}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      className="sw"
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    />
  );
}

export function SwitchRow({ label, hint, checked, onChange, disabled }: { label: string; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="row">
      <div className="min-w-0">
        <b className="block text-sm font-semibold">{label}</b>
        {hint && <small className="note block">{hint}</small>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}

/** Contrôle segmenté (choix unique). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, ReactNode][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([k, l]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex animate-pop items-start gap-2.5 rounded-xl border border-bad/40 bg-bad/10 px-3.5 py-3 text-sm font-semibold text-bad">
      <IconAlert size={18} className="mt-px shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/** Bouton « ? » qui déplie une explication. Sert partout où un champ mérite un mode d'emploi. */
export function Help({ title = "C'est quoi ?", children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line-2 px-2.5 py-1 font-mono text-[11px] tracking-[0.1em] text-accent-3 uppercase transition-colors hover:border-accent-3"
      >
        <IconHelp size={14} /> {open ? 'Fermer' : title}
      </button>
      {open && <div id={id} className="hint-box">{children}</div>}
    </>
  );
}

// ─── Les 4 langues ──────────────────────────────────────────────────────────

/** Sélecteur de langue d'un formulaire : un point vert quand la langue est remplie. */
export function LangPicker({ value, onChange, filled }: { value: Locale; onChange: (l: Locale) => void; filled: Record<Locale, boolean> }) {
  return (
    <div className="langs" role="tablist" aria-label="Langue des textes">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={value === l}
          onClick={() => onChange(l)}
          className={filled[l] ? 'filled' : ''}
          title={l === 'fr' ? 'Français (obligatoire)' : `${LANGS[l].name} (facultatif)`}
        >
          <i aria-hidden="true" />{LANGS[l].label}
        </button>
      ))}
    </div>
  );
}

/** Petit résumé des langues remplies, affiché sur une fiche de la liste. */
export function LangDots({ filled }: { filled: Record<Locale, boolean> }) {
  const missing = LOCALES.filter((l) => !filled[l]);
  return (
    <span
      className="label flex items-center gap-1.5"
      title={missing.length === 0 ? 'Traduit dans les 4 langues' : `Sans traduction : ${missing.map((l) => LANGS[l].name).join(', ')} (le français est affiché à la place)`}
    >
      {LOCALES.map((l) => (
        <span key={l} className={filled[l] ? 'text-ok' : 'text-muted/55'}>{LANGS[l].label}</span>
      ))}
    </span>
  );
}

/** Rappel affiché au-dessus d'un formulaire traduisible. */
export function LangNote({ loc }: { loc: Locale }) {
  if (loc === 'fr') return <p className="note m-0">Le français est obligatoire : c'est lui qui s'affiche quand une traduction manque.</p>;
  return <p className="note m-0">{LANGS[loc].name} facultatif : si tu laisses vide, le site affiche le texte français.</p>;
}

/**
 * Un champ texte traduisible : on édite la langue choisie, le français sert de secours.
 * `values` contient les 4 langues, `onChange` reçoit la langue modifiée.
 */
export function TransField({
  label,
  loc,
  values,
  onChange,
  maxLength,
  rows,
  placeholder,
  error,
  className = '',
  hint,
}: {
  label: string;
  loc: Locale;
  values: Record<Locale, string>;
  onChange: (loc: Locale, v: string) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  error?: string;
  className?: string;
  hint?: ReactNode;
}) {
  const rtl = loc === 'ar';
  const fr = values.fr.trim();
  const shared = {
    className: `input ${error ? 'is-bad' : ''} ${rtl ? 'ar' : ''}`,
    value: values[loc],
    maxLength,
    dir: rtl ? ('rtl' as const) : undefined,
    placeholder: loc === 'fr' ? placeholder : fr ? `Vide → « ${fr.slice(0, 48)}${fr.length > 48 ? '…' : ''} »` : placeholder,
    onChange: (e: { target: { value: string } }) => onChange(loc, e.target.value),
  };
  return (
    <Field
      label={<>{label} <span className="text-accent-3">· {LANGS[loc].label}</span>{loc === 'fr' ? '' : ' · facultatif'}</>}
      error={error}
      hint={hint}
      className={className}
    >
      {rows ? <textarea {...shared} rows={rows} /> : <input {...shared} />}
    </Field>
  );
}

// ─── Mise en page ───────────────────────────────────────────────────────────

export function PageHeader({ crumb, title, action }: { crumb?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumb && <span className="label mb-2 block text-accent-3!">{crumb}</span>}
        <h1 className="display m-0 text-[31px] leading-[1.05] break-words max-sm:text-[25px]">{title}</h1>
      </div>
      {action && <div className="flex flex-wrap gap-2.5">{action}</div>}
    </div>
  );
}

export function Empty({ title, icon, children }: { title: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-2 bg-panel px-6 py-12 text-center">
      <span className="mb-1 grid size-12 place-items-center rounded-2xl border border-line-2 text-accent">{icon ?? <IconBolt size={22} />}</span>
      <b className="display text-xl">{title}</b>
      {children && <div className="flex flex-col items-center gap-3 text-muted">{children}</div>}
    </div>
  );
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-line bg-panel" style={{ animationDelay: `${i * 120}ms` }} />)}
    </div>
  );
}

export function LoadError({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-bad/40 bg-bad/10 px-6 py-10 text-center font-semibold text-bad">
      <span>{error instanceof Error ? error.message : 'Impossible de charger les données.'}</span>
      {retry && <Button variant="ghost" size="sm" onClick={retry}>Réessayer</Button>}
    </div>
  );
}

/** Miniature carrée d'une image (ou case vide). `logo` = image contenue, sans recadrage. */
export function Thumb({ src, alt = '', logo, className = '' }: { src: string | null | undefined; alt?: string; logo?: boolean; className?: string }) {
  return (
    <span className={`thumb ${logo ? 'logo' : ''} ${className}`}>
      {src ? <img src={src} alt={alt} loading="lazy" /> : <svg viewBox="0 0 24 24" width="55%" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>}
    </span>
  );
}

/** Nombre qui « compte » jusqu'à sa valeur (désactivé si l'utilisateur réduit les animations). */
export function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - t0) / 900);
      setN(Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

// ─── Liste de technologies ──────────────────────────────────────────────────

/** Petites étiquettes qu'on ajoute une par une (expériences, formations, projets). */
export function TechInput({ value, onChange, max = 30, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; max?: number; suggestions?: string[] }) {
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t || value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) return setDraft('');
    onChange([...value, t.slice(0, 40)]);
    setDraft('');
  };
  const free = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 8);
  return (
    <div className="flex flex-col gap-2.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((t, i) => (
            <span key={`${t}-${i}`} className="tech animate-pop">
              {t}
              <button type="button" aria-label={`Retirer ${t}`} onClick={() => onChange(value.filter((_, k) => k !== i))} className="text-muted transition-colors hover:text-bad">
                <IconClose size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      {value.length < max && (
        <div className="flex gap-2">
          <input
            className="input min-w-0 flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); } }}
            placeholder="Ex. React, puis Entrée"
            maxLength={40}
            aria-label="Ajouter une technologie"
          />
          <Button variant="ghost" onClick={() => add(draft)} disabled={!draft.trim()}><IconPlus size={16} /> Ajouter</Button>
        </div>
      )}
      {free.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label">Rapide</span>
          {free.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="tech text-muted transition-colors hover:border-accent-2 hover:text-fg">+ {s}</button>
          ))}
        </div>
      )}
      <span className="note">{value.length}/{max} technologies. Elles s'affichent en petites étiquettes sur le site.</span>
    </div>
  );
}

/** Deux flèches pour changer l'ordre d'affichage d'une ligne. */
export function OrderButtons({ index, count, busy, name, onMove }: { index: number; count: number; busy?: boolean; name: string; onMove: (d: -1 | 1) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="label num w-5 text-center max-sm:hidden">{index + 1}</span>
      <Button variant="plain" size="sm" icon aria-label={`Monter ${name}`} disabled={index === 0 || busy} onClick={() => onMove(-1)}><IconUpSmall /></Button>
      <Button variant="plain" size="sm" icon aria-label={`Descendre ${name}`} disabled={index === count - 1 || busy} onClick={() => onMove(1)}><IconDownSmall /></Button>
    </div>
  );
}
const IconUpSmall = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
const IconDownSmall = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>;

/** Bouton « Supprimer » d'une ligne de liste. */
export function DeleteButton({ onClick, label, busy }: { onClick: () => void; label: string; busy?: boolean }) {
  return (
    <Button variant="bad" size="sm" onClick={onClick} loading={busy} aria-label={label}>
      <IconTrash size={15} /><span className="max-md:hidden">Supprimer</span>
    </Button>
  );
}

// ─── Fenêtres ───────────────────────────────────────────────────────────────

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [onClose]);
}

/** Tiroir qui glisse depuis la droite (pleine largeur sur téléphone). */
export function Drawer({ title, header, onClose, children, footer }: { title: string; header: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const closing = useRef(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(onClose, reduce ? 0 : 360);
  }, [onClose]);
  useEscape(close);
  // Rendu dans <body> : l'animation de la page ne doit pas enfermer ce panneau fixe.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Fermer" onClick={close} className={`absolute inset-0 cursor-default bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 right-0 bottom-0 flex w-[min(560px,100%)] flex-col border-l border-line bg-panel transition-transform duration-[420ms] ease-out-soft ${open ? 'translate-x-0' : 'translate-x-[104%]'}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-[22px] py-[18px] max-sm:px-4">
          <div className="min-w-0">{header}</div>
          <Button variant="ghost" size="sm" onClick={close} className="shrink-0">Fermer <IconClose size={14} /></Button>
        </div>
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-[22px] py-5 max-sm:px-4">{children}</div>
        {footer && <div className="flex flex-wrap gap-2.5 border-t border-line px-[22px] py-3.5 max-sm:px-4 max-sm:pb-[calc(14px+env(safe-area-inset-bottom))]">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

/** Barre « Modifications non enregistrées » collée en bas de l'écran. */
export function SaveBar({ show, label = 'Modifications non enregistrées', onCancel, onSave, saving, disabled, saveLabel = 'Enregistrer' }: { show: boolean; label?: ReactNode; onCancel: () => void; onSave: () => void; saving?: boolean; disabled?: boolean; saveLabel?: string }) {
  return createPortal(
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/92 backdrop-blur-md transition-[transform,visibility] duration-300 ease-out-soft lg:left-[248px] max-lg:bottom-[calc(62px+env(safe-area-inset-bottom))] ${show ? 'visible translate-y-0' : 'invisible translate-y-[calc(100%+80px)]'}`}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-[30px] py-3.5 max-sm:px-4 max-sm:py-3">
        <span className="flex items-center gap-2.5 text-sm text-soft"><span className="size-2 animate-pulse rounded-full bg-warn" />{label}</span>
        <span className="flex gap-2.5">
          <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
          <Button size="sm" loading={saving} disabled={disabled} onClick={onSave}>{saveLabel}</Button>
        </span>
      </div>
    </div>,
    document.body,
  );
}

// ─── Confirmation et notifications (affichées une seule fois, dans App) ─────

export function ConfirmHost() {
  const req = useUi((s) => s.confirmReq);
  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { req.resolve(false); useUi.setState({ confirmReq: null }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [req]);
  if (!req) return null;
  const done = (ok: boolean) => {
    req.resolve(ok);
    useUi.setState({ confirmReq: null });
  };
  return (
    <div role="alertdialog" aria-modal="true" aria-label={req.title} className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Annuler" onClick={() => done(false)} className="absolute inset-0 animate-fade cursor-default bg-black/65 backdrop-blur-[2px]" />
      <div className="relative flex w-full max-w-[440px] animate-pop flex-col gap-3 rounded-2xl border border-line-2 bg-panel p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]">
        <span className={`grid size-10 place-items-center rounded-xl border ${req.danger ? 'border-bad/40 text-bad' : 'border-line-2 text-accent'}`}>
          {req.danger ? <IconAlert size={20} /> : <IconBolt size={20} />}
        </span>
        <span className="display text-xl">{req.title}</span>
        <span className="text-[14.5px] leading-relaxed text-soft">{req.message}</span>
        <div className="mt-2 flex flex-wrap justify-end gap-2.5">
          {!req.infoOnly && <Button variant="ghost" onClick={() => done(false)}>Retour</Button>}
          <Button variant={req.danger ? 'danger' : 'accent'} onClick={() => done(true)} autoFocus>
            {req.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ToastHost() {
  const t = useUi((s) => s.toast);
  if (!t) return null;
  const tone = t.tone === 'error' ? 'bg-bad text-[#2a0410]' : t.tone === 'new' ? 'bg-accent text-accent-ink' : 'bg-fg text-bg';
  return (
    <div role="status" key={t.text} className={`fixed right-5 bottom-5 z-[80] flex max-w-[420px] animate-pop items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-[0_20px_50px_-15px_rgb(0_0_0/0.85)] max-lg:inset-x-3 max-lg:bottom-[calc(76px+env(safe-area-inset-bottom))] ${tone}`}>
      {t.tone === 'error' ? <IconAlert size={18} className="shrink-0" /> : <IconCheck size={18} className="shrink-0" />}
      {t.text}
    </div>
  );
}
