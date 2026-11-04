import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { IconCheck, IconExternal, IconFile, IconIdCard, IconImage, IconLayers, IconLinkedin, IconMail, IconPlus, IconSpark } from '@/components/icons';
import { CountUp, Empty, LoadError, Loading, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { ago, badHandle, plural } from '@/lib/format';
import { keys, useInfo } from '@/lib/queries';
import type { Dashboard, Info } from '@/lib/types';
import { useAuth } from '@/store/auth';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3300';

export function DashboardPage() {
  const me = useAuth((s) => s.me);
  const q = useQuery({ queryKey: keys.dashboard, queryFn: () => api<Dashboard>('/admin/dashboard') });
  const info = useInfo();
  const [h] = useState(() => new Date().getHours());
  const hello = h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour';

  return (
    <div>
      <PageHeader
        crumb={`${hello} ${me?.firstName ?? ''}`.trim()}
        title="Tableau de bord"
        action={
          <>
            <a href={SITE_URL} target="_blank" rel="noopener" className="btn btn-ghost"><IconExternal size={17} /> Voir le site</a>
            <Link to="/projets/nouveau" className="btn"><IconPlus size={18} /> Nouveau projet</Link>
          </>
        }
      />
      {q.isPending ? <Loading /> : q.isError ? <LoadError error={q.error} retry={q.refetch} /> : <Content d={q.data} info={info.data} />}
    </div>
  );
}

/** Ce qu'il reste à faire pour que le site soit complet : rappels de l'API + lien LinkedIn cassé. */
function todoList(d: Dashboard, info: Info | undefined) {
  const items: { key: string; label: string; detail: string; to: string; Icon: typeof IconImage }[] = [];
  if (d.todo.photo) items.push({ key: 'photo', label: 'Ajoute ta photo', detail: "Le site affiche un bloc vide à la place de ton portrait.", to: '/profil?onglet=fichiers', Icon: IconImage });
  if (d.todo.cv) items.push({ key: 'cv', label: 'Envoie ton CV (PDF)', detail: 'Sans CV, le bouton « Télécharger mon CV » ne s\'affiche pas.', to: '/profil?onglet=fichiers', Icon: IconFile });
  if (d.todo.bio) items.push({ key: 'bio', label: 'Écris ta biographie', detail: 'Le texte du « À propos » est vide.', to: '/profil', Icon: IconIdCard });
  if (d.todo.projects) items.push({ key: 'projects', label: 'Ajoute un premier projet', detail: 'La section « Projets » du site est vide pour le moment.', to: '/projets/nouveau', Icon: IconLayers });
  if (badHandle(info?.linkedin)) {
    items.push({
      key: 'linkedin',
      label: 'Corrige ton lien LinkedIn',
      detail: `« ${info?.linkedin} » est un nom affiché, pas un pseudo : le lien ne mène nulle part. Colle l'adresse complète de ton profil.`,
      to: '/profil?onglet=reseaux',
      Icon: IconLinkedin,
    });
  }
  return items;
}

function Content({ d, info }: { d: Dashboard; info: Info | undefined }) {
  const c = d.counts;
  const todo = todoList(d, info);
  const kpis = [
    { to: '/projets', label: 'Projets en ligne', value: c.projectsVisible, sub: c.projectsHidden > 0 ? `${c.projectsHidden} masqué(s) en plus` : `${c.projects} au total`, hi: false },
    { to: '/competences', label: 'Compétences', value: c.skills, sub: 'rangées en 4 catégories' },
    { to: '/messages?filtre=nonlus', label: 'Messages non lus', value: c.unreadMessages, sub: `${plural(c.messages, 'message reçu', 'messages reçus')}`, hi: c.unreadMessages > 0 },
    { to: '/parcours', label: 'Parcours', value: c.experiences + c.educations, sub: `${c.experiences} expérience(s) · ${c.educations} diplôme(s)` },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="reveal grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-sm:gap-2.5">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className={`kpi ${k.hi ? 'hi' : ''}`}>
            <span className="label">{k.label}</span>
            <b><CountUp value={k.value} /></b>
            <span>{k.sub}</span>
          </Link>
        ))}
      </div>

      <div className="reveal grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <section className="panel overflow-hidden p-0!">
          <div className="px-5 pt-5 max-sm:px-4">
            <h2 className="panel-title">
              Derniers messages
              <Link to="/messages" className="label text-accent-3!">Tout voir →</Link>
            </h2>
          </div>
          {d.lastMessages.length === 0 ? (
            <div className="px-5 pb-5">
              <Empty title="Aucun message" icon={<IconMail size={22} />}>
                Les demandes envoyées depuis le formulaire de contact du site arrivent ici, en direct.
              </Empty>
            </div>
          ) : (
            <div className="px-5 pb-2 max-sm:px-4">
              {d.lastMessages.map((m) => (
                <Link key={m.id} to={`/messages?ouvrir=${m.id}`} className="group flex items-center gap-3 border-b border-line py-3 last:border-0">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl border ${m.read ? 'border-line text-muted' : 'border-accent/45 text-accent'}`}>
                    <IconMail size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className={`block truncate text-sm ${m.read ? 'font-medium' : 'font-semibold'}`}>{m.subject}</b>
                    <span className="label block truncate normal-case">{m.name} · {ago(m.createdAt)}</span>
                  </span>
                  {!m.read && <span className="pill pill-accent shrink-0"><i />Non lu</span>}
                  <span className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title">À compléter <span className="label">{todo.length === 0 ? 'rien à faire' : `${todo.length} point(s)`}</span></h2>
          {todo.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-ok/35 bg-ok/8 px-3.5 py-3">
              <span className="mt-0.5 shrink-0 text-ok"><IconCheck size={18} /></span>
              <p className="m-0 text-sm text-soft">Ton portfolio est complet : photo, CV, biographie et projets sont en place.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todo.map(({ key, label, detail, to, Icon }) => (
                <Link key={key} to={to} className="group flex items-start gap-3 rounded-xl border border-line bg-sunk px-3.5 py-3 transition-colors hover:border-accent-2">
                  <span className="mt-0.5 shrink-0 text-warn"><Icon size={17} /></span>
                  <span className="min-w-0">
                    <b className="block text-sm font-semibold transition-colors group-hover:text-accent-3">{label}</b>
                    <span className="note">{detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="row mt-3 border-t border-line pt-3.5">
            <div className="min-w-0">
              <b className="block text-sm font-semibold">Disponibilité affichée</b>
              <span className="note">Se règle dans « Mon profil ».</span>
            </div>
            <span className={`pill ${d.available ? 'pill-ok' : 'pill-off'}`}><i />{d.available ? 'Disponible' : 'Indisponible'}</span>
          </div>
        </section>
      </div>

      <section className="panel reveal">
        <h2 className="panel-title">Raccourcis</h2>
        <div className="grid grid-cols-4 gap-2.5 max-[900px]:grid-cols-2">
          {[
            { to: '/projets/nouveau', label: 'Nouveau projet', Icon: IconPlus },
            { to: '/competences', label: 'Mes compétences', Icon: IconSpark },
            { to: '/profil', label: 'Mon profil', Icon: IconIdCard },
            { to: '/messages', label: 'Messages', Icon: IconMail },
          ].map(({ to, label, Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-2.5 rounded-xl border border-line bg-sunk px-3.5 py-3 text-sm font-medium transition-colors hover:border-accent-2 hover:text-accent-3">
              <Icon size={17} /> <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
