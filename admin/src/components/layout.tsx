import { useEffect, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  IconBriefcase, IconDashboard, IconExternal, IconGraduation, IconIdCard, IconLayers, IconLogout, IconMail, IconMenu, IconSpark, IconUser, type P,
} from '@/components/icons';
import { useLive, useLiveUpdates } from '@/lib/live';
import { queryClient, useInfo, useUnreadCount } from '@/lib/queries';
import { useAuth } from '@/store/auth';
import { confirm, useUi } from '@/store/ui';

interface NavItem { to: string; label: string; short?: string; Icon: ComponentType<P>; badge?: boolean }

const MAIN: NavItem[] = [
  { to: '/', label: 'Tableau de bord', short: 'Accueil', Icon: IconDashboard },
  { to: '/messages', label: 'Messages', Icon: IconMail, badge: true },
  { to: '/projets', label: 'Projets', Icon: IconLayers },
  { to: '/competences', label: 'Compétences', short: 'Compét.', Icon: IconSpark },
];
const CONTENT: NavItem[] = [
  { to: '/parcours', label: 'Expérience', Icon: IconBriefcase },
  { to: '/formation', label: 'Formation', Icon: IconGraduation },
  { to: '/profil', label: 'Mon profil', Icon: IconIdCard },
];
const ACCOUNT: NavItem[] = [{ to: '/compte', label: 'Mon compte', Icon: IconUser }];
const ALL = [...MAIN, ...CONTENT, ...ACCOUNT];

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3300';

/** Monogramme + nom : la photo du profil quand elle est en ligne, sinon les initiales. */
export function BrandMark({ name, photoUrl, size = 'md' }: { name?: string; photoUrl?: string | null; size?: 'md' | 'sm' }) {
  const label = name?.trim() || 'Portfolio';
  const initials = label.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  const big = size === 'md';
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${big ? 'text-[16px]' : 'text-[15px]'}`}>
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line-2 bg-panel-2 font-mono text-[11px] font-semibold text-accent ${big ? 'size-9' : 'size-8'}`}
        style={{ boxShadow: '0 0 0 1px rgb(255 65 205 / 0.18), 0 10px 30px -14px rgb(149 115 255 / 0.7)' }}
      >
        {photoUrl ? <img src={photoUrl} alt="" className="size-full object-cover" /> : initials || 'PF'}
      </span>
      <span className="min-w-0">
        <b className="display block truncate leading-tight" title={label}>{label}</b>
        <span className="label block text-[9.5px]!">Administration</span>
      </span>
    </span>
  );
}

function Brand({ size }: { size?: 'md' | 'sm' }) {
  const { data } = useInfo();
  return <BrandMark name={data?.name} photoUrl={data?.photoUrl} size={size} />;
}

/** Voyant vert quand l'écran reçoit les nouveaux messages en direct. */
function LiveDot({ compact }: { compact?: boolean }) {
  const connected = useLive((s) => s.connected);
  return (
    <span className="label flex items-center gap-2 normal-case" title={connected ? 'Les nouveaux messages arrivent en direct' : 'Connexion en direct coupée, reconnexion…'}>
      <span className={`live-dot ${connected ? '' : 'off'}`} />
      {!compact && (connected ? 'En direct' : 'Reconnexion…')}
    </span>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data: unread = 0 } = useUnreadCount();
  const link = ({ to, label, Icon, badge }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative flex items-center gap-[11px] rounded-[10px] px-[11px] py-[9px] font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-accent-2/15 text-fg before:absolute before:top-2 before:bottom-2 before:-left-3.5 before:w-[3px] before:rounded-r-[3px] before:bg-accent'
            : 'text-muted hover:bg-panel-2 hover:text-fg'
        }`
      }
    >
      <Icon size={18} />
      <span className="flex-1 truncate">{label}</span>
      {badge && unread > 0 && <span className="rounded-full bg-accent px-[7px] py-px font-mono text-[11px] font-semibold text-accent-ink">{unread}</span>}
    </NavLink>
  );
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-1">
      {MAIN.map(link)}
      <span className="label px-2.5 pt-4 pb-1.5">Mon contenu</span>
      {CONTENT.map(link)}
      <span className="label px-2.5 pt-4 pb-1.5">Accès</span>
      {ACCOUNT.map(link)}
    </nav>
  );
}

function SideFooter({ onNavigate }: { onNavigate?: () => void }) {
  const me = useAuth((s) => s.me);
  const logout = useAuth((s) => s.logout);
  const doLogout = async () => {
    onNavigate?.();
    if (await confirm({ title: 'Se déconnecter ?', message: 'Tu devras entrer à nouveau ton identifiant et ton mot de passe.', confirmLabel: 'Se déconnecter' })) {
      logout();
      queryClient.clear();
    }
  };
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3.5">
      <a href={SITE_URL} target="_blank" rel="noopener" className="flex items-center gap-2.5 px-1 text-[13px] font-medium text-muted transition-colors hover:text-accent-3">
        <IconExternal size={16} /> Voir le site
      </a>
      <div className="flex items-center gap-2.5">
        <span className="grid size-[34px] shrink-0 place-items-center rounded-full border border-line-2 bg-panel-2 font-semibold text-accent-2">
          {(me?.firstName ?? '?')[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate text-sm">{me?.firstName} {me?.lastName}</b>
          <LiveDot />
        </span>
        <button type="button" onClick={doLogout} aria-label="Se déconnecter" title="Se déconnecter" className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-panel-2 hover:text-bad">
          <IconLogout size={18} />
        </button>
      </div>
    </div>
  );
}

/** Barre du bas sur téléphone / tablette : 4 pages + « Menu » (qui ouvre tout). */
function TabBar() {
  const { data: unread = 0 } = useUnreadCount();
  const { menuOpen, setMenu } = useUi();
  const { pathname } = useLocation();
  const inMenu = !MAIN.some((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)));
  const cls = (active: boolean) => `relative flex flex-1 flex-col items-center justify-center gap-[3px] text-[10.5px] font-semibold transition-colors ${active ? 'text-accent' : 'text-muted'}`;
  return (
    <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(62px+env(safe-area-inset-bottom))] border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden">
      {MAIN.map(({ to, label, short, Icon, badge }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenu(false)} className={({ isActive }) => cls(isActive && !menuOpen)}>
          <Icon size={21} />
          {short ?? label}
          {badge && unread > 0 && (
            <span className="absolute top-1.5 left-1/2 ml-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-accent-ink">{unread}</span>
          )}
        </NavLink>
      ))}
      <button type="button" onClick={() => setMenu(!menuOpen)} aria-expanded={menuOpen} className={cls(menuOpen || inMenu)}>
        <IconMenu size={21} />
        Menu
      </button>
    </nav>
  );
}

/** Menu complet qui glisse depuis la gauche (tablette et téléphone). */
function MenuDrawer() {
  const { menuOpen, setMenu } = useUi();
  const close = () => setMenu(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, setMenu]);
  return (
    <div className={`fixed inset-0 z-[35] lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`} inert={!menuOpen}>
      <button type="button" aria-label="Fermer le menu" onClick={close} className={`absolute inset-0 cursor-default bg-black/60 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute top-0 bottom-0 left-0 flex w-[min(286px,88%)] flex-col overflow-y-auto border-r border-line bg-panel px-3.5 pt-5 pb-[calc(80px+env(safe-area-inset-bottom))] transition-transform duration-[400ms] ease-out-soft ${menuOpen ? 'translate-x-0' : '-translate-x-[104%]'}`}>
        <div className="px-2 pb-5"><Brand /></div>
        <NavLinks onNavigate={close} />
        <div className="mt-6 flex flex-1 flex-col"><SideFooter onNavigate={close} /></div>
      </div>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const setMenu = useUi((s) => s.setMenu);
  useLiveUpdates();
  // Ferme le menu et remonte en haut à chaque changement de page.
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname, setMenu]);
  const current = ALL.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* PC : menu fixe à gauche */}
      <aside className="sticky top-0 flex h-dvh flex-col gap-1.5 overflow-y-auto border-r border-line bg-panel px-3.5 py-[18px] max-lg:hidden">
        <div className="px-2 pt-1.5 pb-[18px]"><Brand /></div>
        <NavLinks />
        <SideFooter />
      </aside>

      <div className="min-w-0">
        {/* Tablette et téléphone : barre du haut */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-panel/92 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <Brand size="sm" />
          <span className="flex min-w-0 items-center gap-3">
            <span className="label truncate max-[380px]:hidden">{current?.short ?? current?.label ?? ''}</span>
            <LiveDot compact />
          </span>
        </header>

        <main className="mx-auto max-w-[1280px] px-[30px] pt-[26px] pb-[60px] max-lg:px-5 max-lg:pb-[110px] max-sm:px-4 max-sm:pt-[18px]">
          <Outlet />
        </main>
      </div>

      <MenuDrawer />
      <TabBar />
    </div>
  );
}
