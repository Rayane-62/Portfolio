"use client";

/*
 * Pose le thème avant le premier rendu, sans clignotement.
 * Le script n'est exécutable que dans le HTML envoyé par le serveur : si React
 * recrée la balise côté navigateur, elle devient un bloc de données inerte,
 * ce qui évite l'avertissement « Encountered a script tag… ».
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function ThemeScript() {
  return (
    <script
      suppressHydrationWarning
      type={typeof window === "undefined" ? "text/javascript" : "application/json"}
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
