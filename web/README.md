# Portfolio — site public

Site public du portfolio de **BENLALAM Mohamed Rayane**, développeur full stack à Alger.
Quatre langues (français, anglais, espagnol, arabe — l'arabe passe la page en RTL), thème sombre et
clair, et tout le contenu servi par l'API du portfolio : rien n'est codé en dur dans le site.

| Dossier              | Rôle                  | Techno                         | Port |
|----------------------|-----------------------|--------------------------------|------|
| `../portfolio-backend` | API + base de données | NestJS 11, Drizzle, PostgreSQL | 4300 |
| `.` (ici)            | Site public           | Next.js 16, next-intl          | 3300 |
| `../portfolio-admin` | Site admin (gestion)  | Vite + React                   | 5200 |

---

## 1. Démarrer

L'API doit tourner d'abord (voir son `README.md`).

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3300 → redirige vers /fr
```

| Commande          | Ce qu'elle fait               |
|-------------------|-------------------------------|
| `npm run dev`     | serveur de développement      |
| `npm run build`   | build de production           |
| `npm start`       | sert le build (`-p 3300`)     |
| `npm run lint`    | ESLint                        |

## 2. Variables d'environnement (`.env.local`)

| Variable               | Rôle                                            | Défaut                      |
|------------------------|-------------------------------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL`  | URL de l'API du portfolio                       | `http://localhost:4300/api` |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (SEO, sitemap, Open Graph) | `http://localhost:3300`     |

`NEXT_PUBLIC_API_URL` est lue aussi côté navigateur : le formulaire de contact poste directement à
l'API, pour que sa limite « 10 messages par 10 minutes et par IP » voie l'IP du visiteur et non celle
du serveur Next.

## 3. D'où vient le contenu

Un seul appel par langue : `GET /public/portfolio?locale=fr|en|es|ar`, déjà traduit par l'API
(`lib/api.ts`). Les pages sont pré-rendues et revalidées toutes les 60 secondes : ce qui est changé
dans l'admin apparaît sur le site dans la minute.

- **Projets :** la section part **vide**. Aucun projet n'est codé en dur ; tant que l'admin n'en
  publie aucun, la section affiche un état vide assumé.
- **Réseaux sociaux :** les huit (GitHub, LinkedIn, Instagram, Facebook, X, YouTube, Behance,
  Dribbble) sont facultatifs. L'API renvoie `null` quand le champ est vide : le bouton n'est pas
  rendu du tout, sans espace réservé.
- **CV :** le bouton « Télécharger mon CV » n'apparaît que si `cvUrl` n'est pas `null`.
- **Photo :** affichée dans « À propos » seulement si `photoUrl` est renseignée.

Le formulaire de contact envoie `POST /public/contact` (nom, e-mail, téléphone facultatif, objet,
message). Les erreurs sont gérées, y compris le 429 « trop de demandes ».

## 4. Le design

Direction « immersive » : violet nuit profond, **terrain filaire WebGL** en perspective qui ondule
et réagit au curseur, astre posé sur l'horizon, accents magenta / violet / cyan.
Polices Space Grotesk + Outfit, et Noto Kufi Arabic en arabe.

- `components/scene.tsx` — la scène : shaders écrits à la main, boucle de rendu, HUD
  « WebGL / x seg / y fps ». Mise en pause hors écran et onglet caché, grille réduite et DPR plafonné
  en mobile, repli canvas 2D puis dégradé CSS si WebGL manque, scène figée si
  `prefers-reduced-motion`.
- `components/scramble.tsx` — brouillage des lettres des titres, au survol sur ordinateur et au
  toucher sur mobile (désactivé si `prefers-reduced-motion`). L'arabe est brouillé avec des lettres
  arabes, pour ne pas casser la liaison cursive.
- `app/globals.css` — jetons de couleur des deux thèmes et toute la mise en page (CSS écrit à la
  main, pas de framework utilitaire).

Le thème est posé par un petit script avant le premier rendu : pas de clignotement, et la préférence
est retenue dans `localStorage`.
