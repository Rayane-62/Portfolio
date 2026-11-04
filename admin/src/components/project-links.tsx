import { Field } from '@/components/ui';
import type { LinksValue } from '@/lib/links';
import type { ProjectCategory, Repo } from '@/lib/types';

/** Un lien vide = pas de bouton sur le site. */
export function ProjectLinks({ kinds, value, onChange }: { kinds: ProjectCategory[]; value: LinksValue; onChange: (v: LinksValue) => void }) {
  const all = kinds.length === 0;
  const has = (k: ProjectCategory) => all || kinds.includes(k);
  const set = (k: Exclude<keyof LinksValue, 'repos'>) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const setRepo = (i: number, k: keyof Repo, v: string) =>
    onChange({ ...value, repos: value.repos.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  const url = { className: 'input', inputMode: 'url' as const, maxLength: 1000 };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {has('web') && (
          <Field label="Site en ligne">
            <input {...url} value={value.liveUrl} onChange={set('liveUrl')} placeholder="https://mon-site.dz" />
          </Field>
        )}
        {has('mobile') && (
          <>
            <Field label="Google Play (Android)">
              <input {...url} value={value.playStoreUrl} onChange={set('playStoreUrl')} placeholder="https://play.google.com/store/apps/details?id=…" />
            </Field>
            <Field label="App Store (iOS)">
              <input {...url} value={value.appStoreUrl} onChange={set('appStoreUrl')} placeholder="https://apps.apple.com/app/…" />
            </Field>
          </>
        )}
        {has('desktop') && (
          <Field label="Téléchargement (logiciel)">
            <input {...url} value={value.downloadUrl} onChange={set('downloadUrl')} placeholder="https://github.com/…/releases" />
          </Field>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="label">Dépôts GitHub · 1 ou 2, nom facultatif</span>
        {value.repos.map((r, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-2 max-sm:grid-cols-1">
            <input className="input" value={r.label} onChange={(e) => setRepo(i, 'label', e.target.value)} maxLength={40} placeholder={i === 0 ? 'Front' : 'Back'} aria-label={`Nom du dépôt ${i + 1}`} />
            <input {...url} value={r.url} onChange={(e) => setRepo(i, 'url', e.target.value)} placeholder="https://github.com/Rayane-62/…" aria-label={`Lien du dépôt ${i + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
