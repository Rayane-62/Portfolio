"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
} from "react";

/* ============================================================
   BROUILLAGE DE LETTRES
   Repris de la maquette « brutalist » : les lettres défilent en
   glyphes aléatoires puis se révèlent de gauche à droite.
   Déclenché au survol (ordinateur) et au toucher (mobile).
   Coupé si `prefers-reduced-motion`.
   ============================================================ */

const GLYPHS_LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>{}[]#$%&*";
/* l'arabe est cursif : brouiller avec des lettres latines casserait
   la ligne — on tire donc dans l'alphabet du texte lui-même */
const GLYPHS_ARABIC = "أبتثجحخدذرزسشصضطظعغفقكلمنهوي٠١٢٣٤٥٦٧٨٩";

const ARABIC_RE = /[؀-ۿ]/;

const TOTAL_FRAMES = 13;
const FRAME_MS = 34;
const MAX_LEN = 60;

function scrambleOnce(target: string, frame: number): string {
  const glyphs = ARABIC_RE.test(target) ? GLYPHS_ARABIC : GLYPHS_LATIN;
  const chars = Array.from(target);
  const revealed = chars.length * (frame / TOTAL_FRAMES);
  return chars
    .map((c, i) => {
      if (c === " " || c === "\n" || c === " ") return c;
      if (i < revealed) return c;
      return glyphs[(Math.random() * glyphs.length) | 0];
    })
    .join("");
}

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Moteur commun : brouille une ou plusieurs lignes en même temps.
 * Rend les lignes affichées et le déclencheur à brancher sur l'élément.
 */
function useScramble(lines: string[]) {
  const [scrambled, setScrambled] = useState(lines);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const linesRef = useRef(lines);

  // le texte à atteindre, toujours à jour (la langue peut changer)
  useEffect(() => {
    linesRef.current = lines;
  });

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    []
  );

  const start = useCallback(() => {
    if (busyRef.current) return;
    const target = linesRef.current;
    const total = target.join("").length;
    if (!total || total > MAX_LEN) return;
    if (reducedMotion()) return;

    busyRef.current = true;
    setBusy(true);
    setScrambled(target.map((l) => scrambleOnce(l, 0)));
    /* L'avancement se lit sur l'horloge, pas sur le nombre d'appels : sur une
       machine lente, les images sautent mais l'effet dure toujours ~450 ms. */
    const started = performance.now();
    timer.current = setInterval(() => {
      const frame = Math.ceil((performance.now() - started) / FRAME_MS);
      if (frame >= TOTAL_FRAMES) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        busyRef.current = false;
        setBusy(false);
        return;
      }
      setScrambled(linesRef.current.map((l) => scrambleOnce(l, frame)));
    }, FRAME_MS);
  }, []);

  // hors animation on rend le texte propre : un changement de langue
  // s'affiche tout de suite, sans effet de synchronisation
  return { display: busy ? scrambled : lines, busy, start };
}

const TRIGGER_PROPS = (start: () => void) => ({
  onMouseEnter: start,
  onTouchStart: start,
  onFocus: start,
});

/**
 * Un titre dont les lettres se brouillent au survol / au toucher.
 * Réservé aux titres : à éviter sur du texte courant.
 */
export function Scramble({
  text,
  as: Tag = "span",
  className,
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const { display, busy, start } = useScramble([text]);
  return (
    <Tag
      id={id}
      className={className}
      data-scramble=""
      data-scrambling={busy ? "true" : undefined}
      {...TRIGGER_PROPS(start)}
    >
      {display[0]}
    </Tag>
  );
}

/**
 * Même effet sur un titre à plusieurs lignes (le nom du héros) :
 * les lignes se brouillent ensemble, pas l'une après l'autre.
 */
export function ScrambleLines({
  lines,
  as: Tag = "span",
  className,
  lineClassNames = [],
}: {
  lines: string[];
  as?: ElementType;
  className?: string;
  lineClassNames?: (string | undefined)[];
}) {
  const { display, busy, start } = useScramble(lines);
  return (
    <Tag
      className={className}
      data-scramble=""
      data-scrambling={busy ? "true" : undefined}
      {...TRIGGER_PROPS(start)}
    >
      {display.map((line, i) => (
        <span key={i} className={lineClassNames[i]}>
          {line}
        </span>
      ))}
    </Tag>
  );
}
