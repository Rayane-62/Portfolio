import type { ReactNode } from 'react';
import type { SocialKey } from '@/lib/types';

/** Icônes au trait (même style que la maquette du site). Décoratives par défaut. */
export type P = { size?: number; className?: string; strokeWidth?: number };

function Svg({ size = 20, className, strokeWidth = 1.8, children }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

// ── Navigation ──
export const IconDashboard = (p: P) => <Svg {...p}><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" /></Svg>;
export const IconIdCard = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2.2" /><path d="M6 16c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2M14.5 10h4M14.5 13.5h3" /></Svg>;
export const IconSpark = (p: P) => <Svg {...p}><path d="M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7 10.2 7.9z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></Svg>;
export const IconBriefcase = (p: P) => <Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 12h18M11 12v2h2v-2" /></Svg>;
export const IconGraduation = (p: P) => <Svg {...p}><path d="M12 4l9 4.5-9 4.5-9-4.5L12 4z" /><path d="M6.5 10.5V15c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.5M20 9.5v5" /></Svg>;
export const IconLayers = (p: P) => <Svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></Svg>;
export const IconMail = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 7.5l8.5 6 8.5-6" /></Svg>;
export const IconUser = (p: P) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></Svg>;
export const IconMenu = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>;

// ── Actions ──
export const IconPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconClose = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconTrash = (p: P) => <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>;
export const IconEdit = (p: P) => <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></Svg>;
export const IconCheck = (p: P) => <Svg {...p}><path d="M5 12l5 5 9-10" /></Svg>;
export const IconUp = (p: P) => <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>;
export const IconDown = (p: P) => <Svg {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>;
export const IconSearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
export const IconLogout = (p: P) => <Svg {...p}><path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 16l-4-4 4-4M6 12h10" /></Svg>;
export const IconExternal = (p: P) => <Svg {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></Svg>;
export const IconHelp = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 114.4 1.7c-1 .9-2 1.3-2 2.6M12 17v.01" /></Svg>;
export const IconKey = (p: P) => <Svg {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3" /></Svg>;
export const IconCopy = (p: P) => <Svg {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V4h12" /></Svg>;

// ── Contenu ──
export const IconImage = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></Svg>;
export const IconFile = (p: P) => <Svg {...p}><path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7l-4-4z" /><path d="M13.5 3.5V7.5h4M9 13h6M9 16.5h4" /></Svg>;
export const IconStar = (p: P) => <Svg {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></Svg>;
export const IconEye = (p: P) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const IconEyeOff = (p: P) => <Svg {...p}><path d="M4 4l16 16" /><path d="M9.6 6c.8-.3 1.6-.5 2.4-.5 6 0 9.5 6.5 9.5 6.5s-.9 1.6-2.4 3.2M6.6 8.3C4.2 10 2.5 12 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.5" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></Svg>;
export const IconAlert = (p: P) => <Svg {...p}><path d="M12 3.5l9.5 17H2.5L12 3.5z" /><path d="M12 10v4M12 17.5v.01" /></Svg>;
export const IconBolt = (p: P) => <Svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></Svg>;
export const IconPhone = (p: P) => <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" /></Svg>;
export const IconWhatsapp = (p: P) => (
  <Svg {...p}>
    <path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-3.9-1L4 20z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2L9 9.5z" />
  </Svg>
);
export const IconGlobe = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></Svg>;
export const IconCheckAll = (p: P) => <Svg {...p}><path d="M2 13l4 4 8-9M12 15l2 2 8-9" /></Svg>;

// ── Réseaux sociaux ──
export const IconGithub = (p: P) => (
  <Svg {...p}><path d="M9 19c-4 1.3-4-2.2-6-2.7m12 5.7v-3.9c0-1.1.1-1.5-.6-2.2 2.9-.3 4.7-1.6 4.7-5.3a4.2 4.2 0 00-1.2-2.9 3.9 3.9 0 00-.1-2.9s-1.3-.4-4.1 1.6a10 10 0 00-5.4 0C5.5 4.5 4.2 4.9 4.2 4.9a3.9 3.9 0 00-.1 2.9A4.2 4.2 0 002.9 10.7c0 3.7 1.8 5 4.7 5.3-.7.7-.7 1.4-.6 2.2V22" /></Svg>
);
export const IconLinkedin = (p: P) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 10.5V17M7 7.6v.01M11.5 17v-3.6a2 2 0 014 0V17" /></Svg>;
export const IconInstagram = (p: P) => <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><path d="M17 7v.01" /></Svg>;
export const IconFacebook = (p: P) => <Svg {...p}><path d="M14 21v-8h3l.5-3.5H14V7.8c0-1 .4-1.8 1.8-1.8h1.9V3.1A20 20 0 0015 3c-2.7 0-4.5 1.6-4.5 4.6v1.9H7.5V13h3v8" /></Svg>;
export const IconX = (p: P) => <Svg {...p}><path d="M4 4l16 16M20 4L4 20" /></Svg>;
export const IconYoutube = (p: P) => <Svg {...p}><rect x="2.5" y="6" width="19" height="12" rx="4" /><path d="M11 9.5l4 2.5-4 2.5z" /></Svg>;
export const IconBehance = (p: P) => <Svg {...p}><path d="M3 5.5h5a3 3 0 010 6H3zM3 11.5h5.5a3.2 3.2 0 010 6.5H3zM14 14.5h7a3.5 3.5 0 10-7 0c0 2 1.6 3.5 3.5 3.5 1.3 0 2.4-.6 3-1.6" /></Svg>;
export const IconDribbble = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M5 7.5c4 .3 8.6 2.2 11.3 6.5M3.5 14c3.6-1.6 9-1.6 12.5 2.8M9.2 3.6c3.5 3.4 5.4 8 5.8 13" /></Svg>;

const SOCIAL_ICONS: Record<SocialKey, (p: P) => ReactNode> = {
  github: IconGithub,
  linkedin: IconLinkedin,
  instagram: IconInstagram,
  facebook: IconFacebook,
  x: IconX,
  youtube: IconYoutube,
  behance: IconBehance,
  dribbble: IconDribbble,
};

/** L'icône d'un réseau social, choisie par sa clé (github, linkedin…). */
export function SocialIcon({ network, ...p }: P & { network: SocialKey }) {
  const Icon = SOCIAL_ICONS[network];
  return <Icon {...p} />;
}
