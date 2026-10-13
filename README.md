# Portfolio — Benlalam Mohamed Rayane

Portfolio personnel multilingue (fr, en, es, ar) construit avec Next.js 16, next-intl, Tailwind CSS 4 et Framer Motion. Le contenu est géré via Strapi, avec un contenu par défaut si le CMS est indisponible.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000 (redirige vers `/fr`).

## Variables d'environnement (`.env.local`)

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `NEXT_PUBLIC_STRAPI_URL` | URL de l'API Strapi | `http://localhost:1337` |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (SEO, sitemap, Open Graph) | `http://localhost:3000` |

## CV

Déposer le fichier dans `public/cv.pdf` : le bouton « Télécharger mon CV » apparaît automatiquement dans le Hero au prochain build.

## Strapi

Types de contenu lus : `projects`, `skills`, `experiences`, `educations`, `info` (single type) et `messages` (formulaire de contact).
Le rôle **Public** doit avoir `find` sur les types lus et `create` sur `messages`. Si l'envoi échoue, le formulaire ouvre la messagerie du visiteur avec le message pré-rempli.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run lint` — ESLint
