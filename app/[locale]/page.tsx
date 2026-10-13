import { existsSync } from "node:fs";
import path from "node:path";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Skills } from "@/components/skills";
import { Projects } from "@/components/projects";
import { Experience } from "@/components/experience";
import { Education } from "@/components/education";
import { Contact } from "@/components/contact";
import {
  getProjects,
  getSkills,
  getExperiences,
  getEducations,
  getInfo,
  type Locale,
} from "@/lib/strapi";
import { CV_PATH } from "@/lib/site";

const HAS_CV = existsSync(path.join(process.cwd(), "public", CV_PATH));

export default async function Home(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  const strapiLocale = locale as Locale;

  const [projects, skills, experiences, educations, info] = await Promise.all([
    getProjects(),
    getSkills(),
    getExperiences(strapiLocale),
    getEducations(strapiLocale),
    getInfo(strapiLocale),
  ]);

  return (
    <>
      <Hero info={info} hasCv={HAS_CV} />
      <About info={info} />
      <Skills skills={skills} />
      <Projects projects={projects} />
      <Experience experiences={experiences} />
      <Education educations={educations} />
      <Contact info={info} />
    </>
  );
}
