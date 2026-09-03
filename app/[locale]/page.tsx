import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Skills } from "@/components/skills";
import { Projects } from "@/components/projects";
import { Experience } from "@/components/experience";
import { Contact } from "@/components/contact";
import {
  getProjects,
  getSkills,
  getExperiences,
  getInfo,
} from "@/lib/strapi";

export default async function Home() {
  const [projects, skills, experiences, info] = await Promise.all([
    getProjects(),
    getSkills(),
    getExperiences(),
    getInfo(),
  ]);

  return (
    <>
      <Hero info={info} />
      <About info={info} />
      <Skills skills={skills} />
      <Projects projects={projects} />
      <Experience experiences={experiences} />
      <Contact info={info} />
    </>
  );
}
