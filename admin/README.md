# Portfolio — admin (React + Vite)

L'espace de gestion du portfolio : profil, compétences, parcours, formation, projets et messages reçus.
Même architecture que les admins des trois boutiques (Vintage, Tech, CABA).

```bash
npm install
cp .env.example .env     # Windows : copy .env.example .env
npm run dev              # http://localhost:5200
```

L'API doit tourner à côté (`../portfolio-backend`, port 4300).
**Connexion :** `admin` / `ChangeMoi123` — un nouveau mot de passe est demandé à la première connexion.

| Commande          | Ce qu'elle fait                          |
|-------------------|------------------------------------------|
| `npm run dev`     | l'admin en développement (port 5200)     |
| `npm run build`   | `tsc -b` puis build de production        |
| `npm run preview` | sert le build de production              |
| `npm run lint`    | oxlint                                   |

## Les pages

| Page             | Adresse         | Ce qu'on y fait                                                        |
|------------------|-----------------|------------------------------------------------------------------------|
| Tableau de bord  | `/`             | compteurs, derniers messages, « à compléter » (photo, CV, bio, projets, lien LinkedIn cassé) |
| Messages         | `/messages`     | demandes du formulaire de contact, non lus en premier, répondre / appeler / WhatsApp |
| Projets          | `/projets`      | CRUD, ordre, image, « en avant » et « affiché »                        |
| Compétences      | `/competences`  | les 36 compétences, filtre par catégorie, ordre, logo devicon          |
| Expérience       | `/parcours`     | postes, périodes, technologies, « Actuel »                             |
| Formation        | `/formation`    | diplômes, établissements, « En cours »                                 |
| Mon profil       | `/profil`       | identité, contact, chiffres, 8 réseaux facultatifs, photo et CV        |
| Mon compte       | `/compte`       | identifiant de connexion et mot de passe                               |

## Bon à savoir

- **Les 4 langues.** Chaque texte traduisible a un sélecteur FR / EN / ES / AR ; seul le français est
  obligatoire. Un point vert indique une langue déjà remplie, et le champ vide affiche en gris le texte
  français qui sera utilisé à la place. Les champs arabes passent en RTL avec la police Noto Kufi.
- **En direct.** L'admin écoute `GET /admin/events` (SSE) : un message envoyé depuis le site s'affiche
  dans la seconde, avec une notification et un petit son. Le voyant du menu indique l'état de la connexion.
- **Rien ne se perd.** Les formulaires longs (profil, projet) affichent une barre
  « Modifications non enregistrées » et demandent confirmation avant de quitter la page.
- **Suppressions.** Toujours précédées d'une fenêtre de confirmation.
- **Ordre d'affichage.** Les flèches ↑ ↓ envoient `PUT /admin/<type>/order` : c'est l'ordre du site.
  Sur les compétences, déplacer une ligne alors qu'une catégorie est filtrée la repose à la place de
  sa voisine affichée, dans la liste complète.
- **Liste des projets.** Elle est chargée en entier puis filtrée dans le navigateur, pour que les flèches
  gardent toujours l'ordre réel du site.

## Style

Mêmes couleurs et mêmes polices que le site public (maquette « immersive ») : violet nuit, accents
magenta / violet / cyan, **Space Grotesk** pour les titres et **Outfit** pour le texte — polices
embarquées dans `src/assets/fonts` (aucun appel à Google Fonts). Pas d'effet 3D ici : c'est un
back-office, il doit rester lisible et rapide, y compris sur téléphone (barre d'onglets en bas,
onglet « Menu » qui ouvre toutes les pages).

## Mise en ligne

`npm run build` produit `dist/`, à déposer sur Vercel, Netlify ou un dossier Nginx.
`vercel.json` et `public/_redirects` renvoient déjà toutes les adresses vers `index.html`.
Dans les variables d'environnement de l'hébergeur : `VITE_API_URL` (l'API) et `VITE_SITE_URL` (le site public).
Pense à ajouter l'adresse de l'admin dans `CORS_ORIGINS` côté API.
