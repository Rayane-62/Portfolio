import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Skills } from "@/components/skills";
import { Experience } from "@/components/experience";
import { Education } from "@/components/education";
import { Projects } from "@/components/projects";
import { Contact } from "@/components/contact";
import { getPortfolio, type Locale } from "@/lib/api";

export default async function Home(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  const data = await getPortfolio(locale as Locale);

  return (
    <>
      <Hero info={data.info} />
      <div className="deck">
        <About info={data.info} />
        <Skills skills={data.skills} />
        <Experience experiences={data.experiences} />
        <Education educations={data.educations} />
        <Projects projects={data.projects} />
        <Contact info={data.info} />
      </div>
    </>
  );
}
