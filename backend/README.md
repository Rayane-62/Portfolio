# Portfolio — API (remplace Strapi)

API et base de données du portfolio personnel : informations, compétences, parcours, formation, projets et
messages du formulaire de contact. Tout se règle depuis l'espace admin, sans toucher au code.
Le site est en **4 langues** (français, anglais, espagnol, arabe) et le français sert de langue de secours.

Même architecture et mêmes conventions que les trois boutiques (Vintage, Tech, CABA) : NestJS 11,
Drizzle, PostgreSQL, un seul compte admin, flux SSE, images converties en WebP, sauvegardes.

| Dossier     | Rôle                  | Techno                         | Port |
|-------------|-----------------------|--------------------------------|------|
| `.` (ici)   | API + base de données | NestJS 11, Drizzle, PostgreSQL | 4300 |
| (à venir)   | Site public           | Next.js                        | 3300 |
| (à venir)   | Site admin (gestion)  | Vite + React                   | 5200 |

Les ports sont différents de Vintage (4100), Tech (4200) et CABA (4000) : tous les projets peuvent tourner
en même temps.

---

## 1. Lancer l'API en local

Prérequis : Node.js 20+ et PostgreSQL installé sur le PC (pas besoin de Docker).

Dans `.env`, mets ton mot de passe et ton port PostgreSQL :

```
DATABASE_URL=postgres://postgres:TON_MOT_DE_PASSE@localhost:5432/portfolio
```

La base `portfolio` est créée automatiquement par `npm run db:migrate`.

```bash
npm install
cp .env.example .env          # sous Windows : copy .env.example .env  (puis corrige DATABASE_URL)
npm run db:migrate            # crée la base et les tables
npm run db:seed:demo          # compte admin + reprise du contenu Strapi (voir § 2)
npm run dev                   # http://localhost:4300/api
```

**Connexion admin :** identifiant `admin` / mot de passe `ChangeMoi123`.
À la première connexion, l'admin est obligé de choisir un nouveau mot de passe
(`mustChangePassword: true` dans la réponse de `/admin/auth/login`).

| Commande                | Ce qu'elle fait                                                       |
|-------------------------|-----------------------------------------------------------------------|
| `npm run db:migrate`    | crée la base si besoin, puis applique les migrations                  |
| `npm run db:seed`       | la ligne « informations » (vide) + le compte admin, **et rien d'autre** |
| `npm run db:import`     | reprend le contenu exporté de Strapi (§ 2)                            |
| `npm run db:seed:demo`  | `db:seed` puis `db:import` : la base complète en une commande         |
| `npm run db:generate`   | génère une migration après une modification de `src/db/schema.ts`     |
| `npm run dev`           | l'API en mode développement (rechargement automatique)                |
| `npm run build` / `start` | build de production, puis `node dist/main.js`                       |
| `npm run typecheck`     | `tsc --noEmit`                                                        |
| `npm run test:smoke`    | test automatique de toute l'API (129 vérifications, § 4)              |
| `npm run backup`        | sauvegarde base + fichiers envoyés (§ 6)                              |

---

## 2. Reprise des données qui étaient dans Strapi

Le contenu de l'ancien Strapi a été exporté dans **`../pf-data/content.json`** : les informations
personnelles, les 36 compétences, les 2 expériences et les 2 formations, avec toutes leurs traductions.
(Les projets, eux, sont volontairement absents : la section part vide et se remplit depuis l'admin.)

```bash
npm run db:import                             # lit ../pf-data/content.json
npm run db:import -- /chemin/vers/autre.json  # un autre fichier
CONTENT_FILE=/chemin/vers/autre.json npm run db:import
```

Ce que le script fait :

- les colonnes du fichier sont écrites à la mode Strapi (`icon_url`, `title_en`, `stats_projects`,
  `name_ar`) : elles sont converties au passage ;
- les technologies arrivent en texte JSON (`"[\"HTML\",\"PHP\"]"`) : elles sont remises en tableau ;
- `available` et `current` arrivent en `0` / `1` : ils deviennent des booléens ;
- **relancer la commande ne crée aucun doublon.** Ce qui existe déjà est mis à jour, ce qui manque est
  ajouté, et ce qui a été ajouté à la main dans l'admin n'est jamais supprimé. Les éléments sont reconnus
  par leur nom : la compétence par son nom, l'expérience par **poste + entreprise**, la formation par
  **diplôme + établissement**, le projet par son titre.

Deux choses ne sont pas dans l'export et restent à faire dans l'admin :

- **la photo et le CV** (Strapi ne les a pas exportés) : à renvoyer depuis « Mes informations » ;
- **le pseudo LinkedIn** : l'export contient `Rayane Benlalam` (un nom affiché, pas un pseudo), donc le
  lien construit ne mène nulle part. Colle l'adresse complète de ton profil
  (`https://www.linkedin.com/in/ton-pseudo`) dans le champ LinkedIn, l'API en gardera le pseudo.
- **le champ « poste en cours »** des expériences n'existait pas dans Strapi : les deux expériences sont
  importées à `current: false`. Coche « Actuel » sur le poste freelance dans l'admin.

---

## 3. Règles métier

### Les 4 langues

Chaque texte traduisible a une colonne en français (`title`) et trois traductions facultatives
(`titleEn`, `titleEs`, `titleAr`). **Une traduction vide (NULL) est remplacée par le français** par l'API :
le site n'a jamais de trou, même avec une seule langue remplie.

`GET /public/portfolio?locale=fr|en|es|ar` renvoie le contenu **déjà traduit** : le front n'a aucune
logique de langue à écrire. Une langue inconnue ou absente = français.

Le nom a un cas à part : `nameAr` (« بن لعلام محمد ريان ») est utilisé seulement sur la version arabe.
La réponse contient toujours aussi `nameLatin`, utile pour les métadonnées ou le pied de page.

### Informations personnelles

Une seule ligne (`id = 1`), créée automatiquement : identité, titre, biographie, photo, CV (PDF),
e-mail, téléphone, WhatsApp, disponibilité et les trois chiffres de la page d'accueil
(projets, années d'expérience, clients).

`whatsappLink` est construit par l'API (`https://wa.me/213…`), le front n'a rien à calculer.

### Réseaux sociaux (tous facultatifs)

GitHub, LinkedIn, Instagram, Facebook, X, YouTube, Behance, Dribbble.
**Tous vides par défaut**, et un réseau vide est renvoyé à `null` au site : le bouton ne s'affiche pas.

On peut coller ce qu'on veut dans le champ — `https://github.com/Rayane-62`, `@Rayane-62` ou
`Rayane-62` : l'API ne garde que le pseudo. L'admin réaffiche le pseudo, et le site reçoit le lien complet
prêt pour un `href`.

### Compétences

Un nom, un logo (en général une URL du CDN [devicon](https://devicon.dev)) et une catégorie :
`frontend`, `backend`, `mobile` ou `tools`. L'API les renvoie **déjà rangées par catégorie**, dans l'ordre
choisi dans l'admin (glisser-déposer → `PUT /admin/skills/order`). Deux compétences ne peuvent pas porter
le même nom (409).

### Parcours et formation

- **Expériences :** poste, entreprise, période (écrite librement : « Juin 2025 → Présent »), description,
  technologies et un indicateur « poste en cours ». Les quatre premiers champs sont traduisibles.
- **Formations :** diplôme, établissement, période, description **facultative** et « diplôme en cours ».

L'ordre d'affichage se règle à la main dans l'admin, dans les deux cas.

### Projets

Titre, description, catégorie (`web`, `mobile`, `desktop`), technologies, image, lien du site en ligne,
lien GitHub, « mis en avant » et « affiché ».

- **La table part vide :** le propriétaire ajoute ses projets lui-même.
- **Masqué** (`visible: false`) = gardé dans l'admin, invisible sur le site.
- **Mis en avant** (`featured`) = remonté en haut de la liste publique.
- Une image remplacée ou retirée est supprimée du serveur.

### Messages du formulaire de contact

Nom, e-mail, objet, message. Du plus récent au plus ancien, avec un compteur de non lus.
L'admin peut marquer lu / non lu, tout marquer comme lu, et supprimer.

- **Limite :** 10 messages par 10 minutes et par IP (bloque les robots sans gêner une vraie personne
  qui s'y reprend à deux fois).
- **En direct :** un message qui arrive est poussé à l'admin connecté par le flux SSE
  (`GET /admin/events`), dans la seconde, sans rafraîchir la page.

### Fichiers envoyés

| `kind`    | Formats acceptés          | Traitement                                 |
|-----------|---------------------------|--------------------------------------------|
| `photo`   | JPG, PNG, WebP, AVIF      | redressée, 1200 px max, convertie en WebP  |
| `project` | JPG, PNG, WebP, AVIF      | redressée, 1600 px max, convertie en WebP  |
| `cv`      | PDF uniquement, 10 Mo max | gardé tel quel                             |

Les images sont limitées à 15 Mo à l'envoi et leur contenu réel est vérifié (un fichier qui se fait passer
pour une image est refusé). Tout est stocké dans `uploads/` et servi sur `/uploads/…`.

### Compte admin

Un seul compte. Le mot de passe du seed doit être changé à la première connexion. Changer le mot de passe
déconnecte les autres appareils (le jeton contient une empreinte du mot de passe).

---

## 4. Test automatique

L'API doit tourner, et le test doit être lancé **sur une base neuve** (il vérifie entre autres que le mot
de passe du seed doit encore être changé) :

```bash
npm run db:migrate && npm run db:seed:demo
npm run dev            # dans un autre terminal
npm run test:smoke     # 129 vérifications
```

Il couvre les 4 langues et le repli sur le français, les réseaux facultatifs (vide → `null`, pseudo et
lien complet acceptés), le formulaire de contact (valide, e-mail invalide, limite par IP), la connexion
(mauvais mot de passe, changement obligatoire), le CRUD et le réordonnancement des quatre types de
contenu, les envois de fichiers (PNG → WebP, faux fichier refusé, PDF accepté pour le CV), les messages,
le tableau de bord et le flux SSE. Il crée puis supprime ses propres données : le contenu repris de Strapi
reste intact.

---

## 5. Référence API (préfixe `/api`)

### Public (aucune connexion)

| Méthode | Route                        | Rôle                                                                    |
|---------|------------------------------|-------------------------------------------------------------------------|
| GET     | `/public/portfolio?locale=`  | tout le site en une requête, déjà traduit : `info` (réseaux en liens complets, `whatsappLink`), `skills` rangées par catégorie, `experiences`, `educations`, `projects` affichés |
| POST    | `/public/contact`            | formulaire de contact `{ name, email, subject, message }` → `{ ok, id }` (10 / 10 min / IP) |
| GET     | `/health`                    | `{ ok: true }` (hors préfixe `/api`)                                    |

### Admin (en-tête `Authorization: Bearer <jeton>`)

| Méthode        | Route                              | Rôle                                        |
|----------------|------------------------------------|---------------------------------------------|
| POST           | `/admin/auth/login`                | connexion (10 essais / 15 min / IP)         |
| GET            | `/admin/auth/me`                   | session en cours                            |
| PATCH          | `/admin/auth/profile`              | prénom, nom, identifiant                    |
| PATCH          | `/admin/auth/password`             | changer le mot de passe (renvoie un jeton)  |
| GET            | `/admin/dashboard`                 | compteurs, 5 derniers messages, rappels     |
| GET/PATCH      | `/admin/info`                      | informations personnelles et réseaux        |
| CRUD           | `/admin/skills`                    | compétences                                 |
| CRUD           | `/admin/experiences`               | parcours professionnel                      |
| CRUD           | `/admin/educations`                | formation                                   |
| CRUD           | `/admin/projects`                  | projets (`?category=`, `?filter=visible\|masque\|featured`) |
| PATCH          | `/admin/projects/:id/visible`      | afficher / masquer un projet                |
| PUT            | `/admin/skills/order`, `/admin/experiences/order`, `/admin/educations/order`, `/admin/projects/order` | nouvel ordre : `{ ids: [3, 1, 2] }` |
| GET            | `/admin/messages`                  | messages reçus (`?filter=nonlus\|lus&page=&limit=`) |
| GET/DELETE     | `/admin/messages/:id`              | détail / suppression                        |
| PATCH          | `/admin/messages/:id/read`         | `{ read: true }` / `{ read: false }`        |
| PATCH          | `/admin/messages/read-all`         | tout marquer comme lu                       |
| POST           | `/admin/uploads?kind=photo\|project\|cv` | envoi d'un fichier → `{ url, publicId }` |
| GET            | `/admin/events`                    | flux SSE en direct                          |

`CRUD` = `GET /` (liste), `POST /` (création), `GET /:id`, `PATCH /:id`, `DELETE /:id`.
Les messages d'erreur sont en français et tutoient, prêts à être affichés tels quels dans l'admin.

---

## 6. Mise en production (VPS)

```bash
npm ci && npm run build && node dist/main.js
```

Utiliser PM2 ou systemd, derrière Nginx.

- **`.env` :** `DATABASE_URL`, `JWT_SECRET` (long et aléatoire : `openssl rand -hex 32`),
  `CORS_ORIGINS` (domaines du site et de l'admin), `PUBLIC_API_URL` (sert à construire l'URL des fichiers),
  `PORT`.
- **Nginx :** ajouter `client_max_body_size 16m;` dans le bloc de l'API, sinon l'envoi d'une photo de
  plus de 1 Mo est refusé.
- **HTTPS :** obligatoire (Let's Encrypt).
- **Hébergeurs à disque éphémère (Railway, Render…) :** les fichiers de `uploads/` disparaissent à chaque
  redémarrage, prévoir un disque persistant ou Cloudinary.

### Sauvegardes

```bash
sudo apt install postgresql-client     # fournit pg_dump
npm run backup                         # test manuel
```

Crée dans `../backups/` un `.dump` de la base et un `.tgz` du dossier `uploads/`, et supprime les
sauvegardes de plus de 14 jours (`BACKUP_DIR`, `BACKUP_KEEP_DAYS` réglables dans `.env`).

Automatique tous les soirs à 3 h (`crontab -e`) :

```
0 3 * * * cd /chemin/vers/portfolio-backend && bash scripts/backup.sh >> ../backups/backup.log 2>&1
```

Idéalement, copier aussi `backups/` ailleurs que sur le VPS (Google Drive avec rclone, un autre serveur…).
Pour restaurer : voir l'en-tête de `scripts/backup.sh`.
