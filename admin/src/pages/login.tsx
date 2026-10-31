import { type FormEvent, type ReactNode, useState } from 'react';
import { Button, ErrorText, Field } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import type { Me } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/ui';

/** Décor sobre reprenant le violet nuit du site : un halo et une grille, rien d'animé en permanence. */
function Shell({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 70% at 50% 0%, rgb(149 115 255 / 0.22), transparent 58%), radial-gradient(80% 50% at 50% 100%, rgb(255 65 205 / 0.14), transparent 60%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_62%)]"
        style={{ backgroundImage: 'linear-gradient(#2a1c4a 1px, transparent 1px), linear-gradient(90deg, #2a1c4a 1px, transparent 1px)', backgroundSize: '46px 46px' }}
      />
      <div className="relative flex w-full max-w-[392px] animate-up flex-col gap-3.5 rounded-[20px] border border-line-2 bg-panel/90 p-[34px] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.95)] backdrop-blur-sm max-sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="display text-[17px] leading-tight">
            Portfolio
            <span className="block font-mono text-[10px] font-normal tracking-[0.18em] text-accent-3 uppercase">Benlalam Mohamed Rayane</span>
          </span>
          <span className="label">admin</span>
        </div>
        <h1 className="display mt-3 mb-0 text-[29px] leading-none">{title}</h1>
        <p className="m-0 text-soft">{intro}</p>
        {children}
      </div>
    </div>
  );
}

export function LoginPage() {
  const setSession = useAuth((s) => s.setSession);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!login.trim() || !password) return setError('Entre ton identifiant et ton mot de passe.');
    setLoading(true);
    setError('');
    try {
      const r = await api<{ token: string; admin: Me }>('/admin/auth/login', { method: 'POST', json: { login: login.trim(), password } });
      setSession(r.token, r.admin);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell title="Connexion" intro="Gère ton portfolio : profil, projets, compétences et messages.">
      <form onSubmit={submit} className="mt-1 flex flex-col gap-3.5" noValidate>
        <Field label="Identifiant">
          <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoFocus />
        </Field>
        <Field label="Mot de passe">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" loading={loading} className="mt-1.5 w-full">Entrer</Button>
        <p className="label m-0 text-center">Espace privé — un seul compte</p>
      </form>
    </Shell>
  );
}

/** Affiché tant que le compte utilise le mot de passe provisoire. */
export function ForcePasswordPage() {
  const me = useAuth((s) => s.me);
  const { setMe, setToken, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!current) return setError('Entre le mot de passe provisoire.');
    if (next.length < 8) return setError('Le nouveau mot de passe doit faire au moins 8 caractères.');
    if (next !== conf) return setError('Les deux mots de passe ne sont pas identiques.');
    setLoading(true);
    setError('');
    try {
      const r = await api<{ token: string }>('/admin/auth/password', { method: 'PATCH', json: { currentPassword: current, newPassword: next } });
      setToken(r.token);
      if (me) setMe({ ...me, mustChangePassword: false });
      toast('Mot de passe enregistré, bienvenue !');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell title="Première connexion" intro={<>Bonjour {me?.firstName}. Pour sécuriser ton espace, choisis ton propre mot de passe.</>}>
      <form onSubmit={submit} className="mt-1 flex flex-col gap-3.5" noValidate>
        <Field label="Mot de passe provisoire">
          <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" autoFocus />
        </Field>
        <Field label="Nouveau mot de passe" hint="8 caractères minimum">
          <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirmer le nouveau mot de passe">
          <input className="input" type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" loading={loading} className="mt-1.5 w-full">Enregistrer et continuer</Button>
        <button type="button" onClick={logout} className="h-9 text-[13px] font-semibold text-muted underline-offset-4 hover:text-fg hover:underline">Se déconnecter</button>
      </form>
    </Shell>
  );
}
