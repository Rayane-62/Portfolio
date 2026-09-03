import { GithubIcon, LinkedInIcon } from "@/components/icons";

const SOCIAL_LINKS = [
  { id: "github", href: "#", icon: GithubIcon, label: "GitHub" },
  { id: "linkedin", href: "#", icon: LinkedInIcon, label: "LinkedIn" },
];

export function SocialLinks() {
  return (
    <div className="flex items-center justify-center gap-1">
      {SOCIAL_LINKS.map(({ id, href, icon: SocialIcon, label }) => (
        <a
          key={id}
          href={href}
          aria-label={label}
          data-cursor-hover
          className="flex size-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-hover-bg)] hover:text-[var(--accent)]"
        >
          <SocialIcon className="size-4" />
        </a>
      ))}
    </div>
  );
}
