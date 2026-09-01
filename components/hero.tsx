"use client";

import { motion } from "framer-motion";
import { Typewriter } from "@/components/typewriter";

const ROLES = [
  "Développeur Full-Stack",
  "Créateur d'expériences web",
  "Passionné d'IA",
];

export function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-screen flex-col items-start justify-center gap-6 px-6 md:px-16"
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm text-[var(--accent)]"
      >
        Disponible pour de nouveaux projets
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl font-extrabold leading-tight text-[var(--text)] sm:text-5xl md:text-6xl"
      >
        Salut, je suis{" "}
        <span className="text-[var(--accent)]">Votre Nom</span>
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-2xl font-semibold text-[var(--text-muted)] sm:text-3xl"
      >
        <Typewriter words={ROLES} />
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-xl text-base text-[var(--text-muted)] sm:text-lg"
      >
        Je conçois et développe des applications web modernes, rapides et
        soignées, du prototype à la mise en production.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-wrap gap-4 pt-2"
      >
        <a
          href="#projects"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
        >
          Voir mes projets
        </a>
        <a
          href="#contact"
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface2)]"
        >
          Me contacter
        </a>
      </motion.div>
    </section>
  );
}
