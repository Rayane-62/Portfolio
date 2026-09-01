import { Hero } from "@/components/hero";

const PLACEHOLDER_SECTIONS = [
  { id: "about", title: "À propos" },
  { id: "skills", title: "Compétences" },
  { id: "projects", title: "Projets" },
  { id: "experience", title: "Expérience" },
  { id: "contact", title: "Contact" },
];

export default function Home() {
  return (
    <>
      <Hero />
      {PLACEHOLDER_SECTIONS.map(({ id, title }) => (
        <section
          key={id}
          id={id}
          className="flex min-h-screen items-center justify-center px-6 md:px-16"
        >
          <h2 className="text-3xl font-bold text-[var(--text-muted)]">
            {title} — à venir
          </h2>
        </section>
      ))}
    </>
  );
}
