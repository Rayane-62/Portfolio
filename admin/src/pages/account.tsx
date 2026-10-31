import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { IconKey, IconUser } from '@/components/icons';
import { Button, ErrorText, Field, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import type { Me } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/ui';

/** « Mon compte » : prénom, nom, identifiant de connexion et mot de passe. */
export function AccountPage() {
  const me = useAuth((s) => s.me);
  const { setMe, setToken } = useAuth();
  const [p, setP] = useState({ firstName: me?.firstName ?? '', lastName: me?.lastName ?? '', login: me?.login ?? '' });
  const [pErr, setPErr] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');

  const profile = useMutation({
    mutationFn: () => api<Me>('/admin/auth/profile', { method: 'PATCH', json: p }),
    onSuccess: (m) => { setMe(m); toast('Profil de connexion enregistré'); },
    onError: (e) => setPErr(errMsg(e)),
  });
  const password = useMutation({
    mutationFn: () => api<{ token: string }>('/admin/auth/password', { method: 'PATCH', json: { currentPassword: pw.current, newPassword: pw.next } }),
    onSuccess: (r) => { setToken(r.token); setPw({ current: '', next: '', confirm: '' }); toast('Mot de passe changé'); },
    onError: (e) => setPwErr(errMsg(e)),
  });

  function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!p.firstName.trim()) return setPErr('Le prénom est obligatoire.');
    if (p.login.trim().length < 3 || /\s/.test(p.login.trim())) return setPErr("L'identifiant doit faire au moins 3 caractères, sans espace.");
    profile.mutate();
  }
  function savePassword(e: FormEvent) {
    e.preventDefault();
    if (!pw.current) return setPwErr('Entre ton mot de passe actuel.');
    if (pw.next.length < 8) return setPwErr('Le nouveau mot de passe doit faire 8 caractères minimum.');
    if (pw.next !== pw.confirm) return setPwErr('Les deux mots de passe ne sont pas identiques.');
    password.mutate();
  }

  return (
    <div>
      <PageHeader crumb="Accès à cet espace" title="Mon compte" />
      <div className="reveal grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-[18px] max-[1000px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <form onSubmit={saveProfile} noValidate className="panel grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <h2 className="panel-title col-span-full m-0!"><span className="flex items-center gap-2"><IconUser size={17} /> Profil de connexion</span></h2>
            <Field label="Prénom"><input className="input" value={p.firstName} onChange={(e) => { setP({ ...p, firstName: e.target.value }); setPErr(''); }} maxLength={60} /></Field>
            <Field label="Nom"><input className="input" value={p.lastName} onChange={(e) => { setP({ ...p, lastName: e.target.value }); setPErr(''); }} maxLength={60} /></Field>
            <Field label="Identifiant" hint="Sert à te connecter ici. Sans espace." className="col-span-full">
              <input className="input" value={p.login} onChange={(e) => { setP({ ...p, login: e.target.value }); setPErr(''); }} autoComplete="username" maxLength={160} />
            </Field>
            <div className="col-span-full flex flex-col gap-3"><ErrorText>{pErr}</ErrorText></div>
            <div className="col-span-full"><Button type="submit" loading={profile.isPending}>Enregistrer</Button></div>
          </form>

          <form onSubmit={savePassword} noValidate className="panel grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <h2 className="panel-title col-span-full m-0!"><span className="flex items-center gap-2"><IconKey size={17} /> Mot de passe</span></h2>
            <Field label="Mot de passe actuel" className="col-span-full"><input className="input" type="password" value={pw.current} onChange={(e) => { setPw({ ...pw, current: e.target.value }); setPwErr(''); }} autoComplete="current-password" /></Field>
            <Field label="Nouveau mot de passe" hint="8 caractères minimum. Les autres appareils seront déconnectés."><input className="input" type="password" value={pw.next} onChange={(e) => { setPw({ ...pw, next: e.target.value }); setPwErr(''); }} autoComplete="new-password" /></Field>
            <Field label="Confirmer"><input className="input" type="password" value={pw.confirm} onChange={(e) => { setPw({ ...pw, confirm: e.target.value }); setPwErr(''); }} autoComplete="new-password" /></Field>
            <div className="col-span-full flex flex-col gap-3"><ErrorText>{pwErr}</ErrorText></div>
            <div className="col-span-full"><Button type="submit" variant="ghost" loading={password.isPending}>Changer le mot de passe</Button></div>
          </form>
        </div>

        <div className="panel min-w-0">
          <h2 className="panel-title">Sécurité</h2>
          <p className="m-0 text-sm leading-relaxed text-soft">
            Un seul compte donne accès à cet espace : le tien. Quand tu changes ton mot de passe, tous les autres appareils
            encore connectés sont déconnectés — pratique si tu t'es connecté une fois sur un ordinateur qui n'est pas le tien.
          </p>
          <p className="note mt-3 mb-0">
            Ce compte ne sert qu'à l'administration : il n'apparaît nulle part sur le site public. Ton nom affiché aux visiteurs
            se règle dans « Mon profil ».
          </p>
        </div>
      </div>
    </div>
  );
}
