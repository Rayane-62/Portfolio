import { SOCIAL_KEYS, type SocialKey, type Socials } from "@/lib/api";

/* Les huit réseaux sont facultatifs : l'API renvoie `null` quand le champ
   est vide, et rien n'est alors rendu — ni icône, ni espace réservé. */

type Def = { label: string; path: React.ReactNode; stroke?: boolean };

const DEFS: Record<SocialKey, Def> = {
  github: {
    label: "GitHub",
    stroke: true,
    path: (
      <path d="M9 18c-4 1-4-2.5-6-3m12 6v-3.4c0-1 .1-1.4-.5-2 2.3-.3 4.5-1.1 4.5-5a3.9 3.9 0 0 0-1.1-2.7 3.6 3.6 0 0 0-.1-2.8s-1.2-.3-3.8 1.4a9.4 9.4 0 0 0-5 0C6.3 2.8 5.1 3.1 5.1 3.1a3.6 3.6 0 0 0-.1 2.8A3.9 3.9 0 0 0 3.9 8.6c0 3.9 2.2 4.7 4.5 5-.6.6-.6 1.2-.5 2V21" />
    ),
  },
  linkedin: {
    label: "LinkedIn",
    path: (
      <path d="M4.5 9.5h3v10h-3zM6 4.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM10.5 9.5h3v1.4a3.4 3.4 0 0 1 3-1.6c2.3 0 3.5 1.5 3.5 4.3v6h-3v-5.4c0-1.4-.5-2.2-1.7-2.2-1.1 0-1.8.8-1.8 2.2v5.4h-3z" />
    ),
  },
  instagram: {
    label: "Instagram",
    stroke: true,
    path: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4.6" />
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  facebook: {
    label: "Facebook",
    path: (
      <path d="M14.5 8.5h2.3V5.6h-2.5c-2.3 0-3.6 1.4-3.6 3.8v1.6H8.5v3h2.2V21h3.1v-7h2.3l.4-3h-2.7V9.6c0-.8.3-1.1 1.2-1.1z" />
    ),
  },
  x: {
    label: "X",
    path: (
      <path d="M5 4l6 7.8L5.4 20H7l5-6.4 4.8 6.4H19l-6.3-8.2L18.4 4h-1.6l-4.5 5.8L8 4z" />
    ),
  },
  youtube: {
    label: "YouTube",
    path: (
      <path d="M21.2 8.3a2.7 2.7 0 0 0-1.9-1.9C17.6 6 12 6 12 6s-5.6 0-7.3.4A2.7 2.7 0 0 0 2.8 8.3C2.4 10 2.4 12 2.4 12s0 2 .4 3.7a2.7 2.7 0 0 0 1.9 1.9C6.4 18 12 18 12 18s5.6 0 7.3-.4a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-3.7.4-3.7s0-2-.4-3.7zM10.2 15.1V8.9l5.3 3.1z" />
    ),
  },
  behance: {
    label: "Behance",
    path: (
      <path d="M2.6 5.8h5.6c2.2 0 3.6 1 3.6 2.9 0 1.2-.6 2-1.6 2.5 1.4.4 2.2 1.4 2.2 2.9 0 2.2-1.6 3.4-4.1 3.4H2.6zm2.7 4.5h2.4c.9 0 1.4-.4 1.4-1.2S8.6 8 7.7 8H5.3zm0 5h2.6c1 0 1.6-.5 1.6-1.4s-.6-1.4-1.6-1.4H5.3zM17.6 9c2.5 0 4 1.7 4 4.4v.6h-5.8c.1 1.2.8 1.9 2 1.9.8 0 1.4-.3 1.7-.9h2c-.4 1.6-1.8 2.6-3.7 2.6-2.5 0-4.1-1.7-4.1-4.3S15.2 9 17.6 9zm-1.8 3.6h3.6c-.1-1.1-.8-1.8-1.8-1.8s-1.7.7-1.8 1.8zM15.4 6.6h4.8v1.5h-4.8z" />
    ),
  },
  dribbble: {
    label: "Dribbble",
    stroke: true,
    path: (
      <>
        <circle cx="12" cy="12" r="8.6" />
        <path d="M5.2 8.4c4.6.6 8.9 2.9 11.4 6.6M9.2 3.9c3.2 3.4 5 7.9 5.2 12.6M20.3 10.7c-4.7-.6-9 .6-12 3.3" />
      </>
    ),
  },
};

export function SocialLinks({ socials }: { socials: Socials }) {
  const items = SOCIAL_KEYS.filter((k) => socials[k]);
  if (items.length === 0) return null;

  return (
    <div className="socials">
      {items.map((k) => {
        const def = DEFS[k];
        return (
          <a
            className="soc"
            key={k}
            href={socials[k] as string}
            target="_blank"
            rel="noopener"
            aria-label={def.label}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              {...(def.stroke ? { "data-stroke": "" } : {})}
            >
              {def.path}
            </svg>
          </a>
        );
      })}
    </div>
  );
}
