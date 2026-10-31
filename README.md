# Portfolio — Benlalam Mohamed Rayane

Portfolio personnel : site public multilingue et son administration maison (Strapi a été retiré).

| Dossier    | Rôle                   | Techno                                   | Port |
|------------|------------------------|------------------------------------------|------|
| `backend/` | API + base de données  | NestJS 11, Drizzle, PostgreSQL           | 4300 |
| `web/`     | Site public            | Next.js 16, next-intl (fr/en/es/ar)      | 3300 |
| `admin/`   | Administration         | Vite, React 19, TanStack Query           | 5200 |
| `maquettes/` | Les 3 directions proposées, dont celle retenue (`2-immersif.html`) | HTML | — |

Les ports sont différents des trois boutiques (Vintage, Cosmétique, Tech) : les quatre projets peuvent tourner en même temps.

---

## 1. Lancer le projet

Prérequis : Node.js 20+ et PostgreSQL. La base `portfolio` est créée automatiquement par `npm run db:migrate`.

```bash
# 1) API
cd backend
npm install
cp .env.example .env          # sous Windows : copy .env.example .env  (puis corrige DATABASE_URL)
npm run db:migrate            # crée la base et les tables
npm run db:seed               # réglages + compte admin
npm run db:import             # reprend le contenu de l'ancien Strapi (profil, compétences, parcours)
npm run dev                   # http://localhost:4300

# 2) Site public (nouveau terminal)
cd web
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3300

# 3) Administration (nouveau terminal)
cd admin
npm install
cp .env.example .env
npm run dev                   # http://localhost:5200
```

**Connexion admin :** identifiant `admin` / mot de passe `ChangeMoi123`.
Au premier login, un nouveau mot de passe est obligatoire.

Test automatique de l'API (l'API doit tourner, sur une base neuve) :

```bash
cd backend && npm run test:smoke
```

---

## 2. Le contenu

Tout se règle depuis l'administration, rien n'est écrit en dur dans le code.

- **Mon profil** — nom, nom en arabe, titre, bio, chacun dans les 4 langues ; photo et CV (PDF) ; e-mail, téléphone, WhatsApp ; disponibilité ; chiffres affichés sur l'accueil ; et les **8 réseaux sociaux, tous facultatifs** (GitHub, LinkedIn, Instagram, Facebook, X, YouTube, Behance, Dribbble). Un réseau laissé vide n'apparaît pas du tout sur le site.
- **Compétences** — nom, catégorie (front-end, back-end, mobile, outils), URL de l'icône (devicon), ordre.
- **Expérience** et **Formation** — poste, entreprise, période, description dans les 4 langues, technologies, « en cours ».
- **Projets** — titre et description dans les 4 langues, catégorie, technologies, image, liens démo et GitHub, « en avant » et « visible ». **La section démarre vide** : tant qu'aucun projet n'est publié, le site affiche un bloc « La sélection arrive » avec un bouton vers le contact.
- **Messages** — les demandes envoyées depuis le formulaire de contact du site (nom, téléphone facultatif, e-mail, besoin). Une nouvelle demande déclenche une notification en direct avec un son. Boutons pour répondre par e-mail, appeler ou écrire sur WhatsApp.

### Traductions

Le français est la langue de référence. Pour chaque texte, l'anglais, l'espagnol et l'arabe sont facultatifs : laissés vides, le site affiche le texte français. Dans l'administration, un point vert indique une langue remplie.

---

## 3. Reprise de l'ancien Strapi

`npm run db:import` lit `backend/data/strapi-content.json` et charge le contenu de l'ancienne installation Strapi : le profil (4 langues, nom en arabe, chiffres), les 36 compétences, les 2 expériences et les 2 diplômes. La commande peut être relancée sans créer de doublon.

Deux choses n'étaient pas dans Strapi et sont à ajouter depuis l'administration :

- **la photo et le CV**, à téléverser dans « Mon profil » ;
- **le lien LinkedIn**, enregistré comme « Rayane Benlalam » (un nom affiché, pas un identifiant) : le lien ne mène nulle part tant que l'adresse complète du profil n'est pas collée.

L'ancien dossier Strapi (`PROJECTS/backend`) n'est plus utilisé par le portfolio. À garder quelque temps par sécurité, puis à archiver.

---

## 4. Référence API (préfixe `/api`)

**Public :**

| Méthode | Route                 | Rôle                                                     |
|---------|-----------------------|----------------------------------------------------------|
| GET     | `/public/portfolio`   | `?locale=fr\|en\|es\|ar` : tout le contenu du site en un appel |
| POST    | `/public/contact`     | formulaire de contact (10 envois / 10 min / IP)          |

**Admin (Bearer token) :** authentification, tableau de bord, profil, CRUD et réordonnancement des compétences / expériences / formations / projets, messages, téléversements (`?kind=photo|project|cv`), flux SSE en direct.

Le détail complet est dans `backend/README.md`.

### Images

Les photos sont redimensionnées (1600 px max) et converties en WebP à l'envoi. Le CV est accepté en PDF (10 Mo max).

---

## 5. Mise en production

- **API :** `npm run build && node dist/main.js`, derrière Nginx, avec PM2 ou systemd.
- **Site :** `npm run build && npm start` (port 3300).
- **Admin :** `npm run build`, puis servir `admin/dist/` en statique avec un repli vers `index.html`.
- **Nginx :** `client_max_body_size 16m;` dans le bloc de l'API, sinon l'envoi de la photo ou du CV est refusé.
- **HTTPS** obligatoire (Let's Encrypt).
- Les variables `NEXT_PUBLIC_*` et `VITE_*` sont figées au moment du `build` : rebâtir après un changement d'adresse.

### Sauvegardes

```bash
cd backend && npm run backup
```

Crée dans `backups/` un fichier `.dump` de la base et un `.tgz` des fichiers envoyés, et supprime les sauvegardes de plus de 14 jours. Automatique tous les soirs à 3 h (`crontab -e`) :

```
0 3 * * * cd /chemin/vers/backend && bash scripts/backup.sh >> ../backups/backup.log 2>&1
```
