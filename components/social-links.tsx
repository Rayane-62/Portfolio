import { GithubIcon, LinkedInIcon } from "@/components/icons";
import { GITHUB_URL, LINKEDIN_URL } from "@/lib/site";

const SOCIAL_LINKS = [
  { id: "github", href: GITHUB_URL, icon: GithubIcon, label: "GitHub" },
  { id: "linkedin", href: LINKEDIN_URL, icon: LinkedInIcon, label: "LinkedIn" },
];

export function SocialLinks() {
  return (
    <div className="flex items-center justify-center gap-1">
      {SOCIAL_LINKS.map(({ id, href, icon: SocialIcon, label }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
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
