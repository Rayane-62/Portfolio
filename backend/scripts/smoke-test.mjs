import sharp from 'sharp';
/**
 * Test rapide de toute l'API, à lancer quand l'API tourne :
 *   npm run test:smoke
 * Variables facultatives : API_URL, ADMIN_LOGIN, ADMIN_PASSWORD
 *
 * Attention : il crée puis supprime des données de test. À ne pas lancer sur la base de production.
 * À lancer sur une base neuve (db:migrate + db:seed + db:import) : le test vérifie entre autres
 * que le mot de passe du seed doit être changé à la première connexion.
 */
const API = (process.env.API_URL ?? 'http://localhost:4300') + '/api';
const LOGIN = process.env.ADMIN_LOGIN ?? 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'ChangeMoi123';

let token = '';
let passed = 0;
const failures = [];

async function call(method, path, body, auth = true, raw, ip) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body && !raw ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      // Autre « visiteur » (l'API fait confiance au 1er proxy) : la limite de 10 messages / 10 min / IP
      // ne bloque pas la suite du test.
      ...(ip ? { 'X-Forwarded-For': ip } : {}),
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failures.push(name); console.log(`  ✗ ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
}

const contact = (extra = {}) => ({
  name: 'Smoke Visiteur',
  email: 'visiteur@example.com',
  phone: '0550 11 22 33',
  subject: 'Smoke — demande de devis',
  message: 'Bonjour, je voudrais un site vitrine pour ma boutique. Peux-tu me dire combien ça coûte ?',
  ...extra,
});

/** Le plus petit PDF valide possible : sert à tester l'envoi du CV. */
function fakePdf() {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n' +
      'trailer<</Root 1 0 R>>\n%%EOF\n',
    'ascii',
  );
}

function upload(buffer, type, filename) {
  const fd = new FormData();
  fd.append('file', new Blob([buffer], { type }), filename);
  return fd;
}

async function main() {
  console.log(`Test de ${API}\n`);

  console.log('Site public — les 4 langues');
  const fr = await call('GET', '/public/portfolio', null, false);
  check('GET /public/portfolio (français)', fr.status === 200 && fr.data.locale === 'fr' && !!fr.data.info?.name, fr.data);
  check('tout en une seule requête', ['info', 'skills', 'experiences', 'educations', 'projects'].every((k) => k in fr.data), Object.keys(fr.data ?? {}));
  check('compétences rangées dans les 4 catégories', ['frontend', 'backend', 'mobile', 'tools'].every((c) => Array.isArray(fr.data.skills[c])), Object.keys(fr.data.skills ?? {}));
  const en = await call('GET', '/public/portfolio?locale=en', null, false);
  const es = await call('GET', '/public/portfolio?locale=es', null, false);
  const ar = await call('GET', '/public/portfolio?locale=ar', null, false);
  check('anglais : titre traduit', en.data.locale === 'en' && en.data.info.title !== fr.data.info.title, en.data.info);
  check('espagnol : biographie traduite', es.data.info.bio !== fr.data.info.bio && !!es.data.info.bio, es.data.info?.bio?.slice(0, 60));
  check('arabe : nom et titre en arabe', /[؀-ۿ]/.test(ar.data.info.name) && /[؀-ۿ]/.test(ar.data.info.title), ar.data.info);
  check('arabe : le nom latin reste disponible', ar.data.info.nameLatin === fr.data.info.name, ar.data.info);
  check('langue inconnue = français', (await call('GET', '/public/portfolio?locale=de', null, false)).data.locale === 'fr');
  check('lien WhatsApp construit par l’API', !fr.data.info.whatsapp || /^https:\/\/wa\.me\/\d+$/.test(fr.data.info.whatsappLink), fr.data.info.whatsappLink);
  check('chiffres du site (projets, expérience, clients)', ['projects', 'experience', 'clients'].every((k) => typeof fr.data.info.stats[k] === 'number'), fr.data.info.stats);
  check('projets : seuls les projets affichés', fr.data.projects.every((p) => p.title), fr.data.projects.length);

  console.log('\nConnexion admin');
  check('mauvais mot de passe refusé (401)', (await call('POST', '/admin/auth/login', { login: LOGIN, password: 'mauvais' }, false)).status === 401);
  check('route admin sans jeton refusée (401)', (await call('GET', '/admin/dashboard', null, false)).status === 401);
  const login = await call('POST', '/admin/auth/login', { login: LOGIN, password: PASSWORD }, false);
  check('connexion', login.status === 200 && !!login.data.token, login.data);
  token = login.data.token;
  const me = await call('GET', '/admin/auth/me');
  check('GET /auth/me', me.data.login?.toLowerCase() === LOGIN.toLowerCase(), me.data);
  check('1re connexion : mot de passe à changer (base neuve)', login.data.admin.mustChangePassword === true, login.data.admin);

  console.log('\nRepli sur le français quand la traduction manque');
  const edus = await call('GET', '/admin/educations');
  check('GET /admin/educations', edus.status === 200 && Array.isArray(edus.data), edus.data);
  const sansTrad = edus.data.find((e) => e.periodEn === null);
  check('une formation sans période traduite existe (données Strapi)', !!sansTrad, edus.data.map((e) => e.periodEn));
  if (sansTrad) {
    const enEdu = en.data.educations.find((e) => e.id === sansTrad.id);
    const arEdu = ar.data.educations.find((e) => e.id === sansTrad.id);
    check('anglais : période vide → période française', enEdu?.period === sansTrad.period, [enEdu?.period, sansTrad.period]);
    check('arabe : période vide → période française', arEdu?.period === sansTrad.period, [arEdu?.period, sansTrad.period]);
    check('anglais : diplôme traduit, lui, est bien traduit', enEdu?.degree === sansTrad.degreeEn, [enEdu?.degree, sansTrad.degreeEn]);
  }
  const eduVide = edus.data.find((e) => e.description === null);
  if (eduVide) {
    check('description facultative vide = null dans les 4 langues', [fr, en, es, ar].every((r) => r.data.educations.find((e) => e.id === eduVide.id)?.description === null));
  }

  console.log('\nInformations et réseaux facultatifs');
  const info0 = (await call('GET', '/admin/info')).data;
  check('GET /admin/info : pseudos bruts (pas les liens)', info0.id === 1 && !String(info0.github ?? '').startsWith('http'), info0.github);
  const vides = await call('PATCH', '/admin/info', { github: '', linkedin: '', instagram: '', facebook: '', x: '', youtube: '', behance: '', dribbble: '' });
  check('réseau vidé = null en base', vides.status === 200 && ['github', 'linkedin', 'instagram', 'facebook', 'x', 'youtube', 'behance', 'dribbble'].every((k) => vides.data[k] === null), vides.data);
  const social0 = (await call('GET', '/public/portfolio', null, false)).data.info.socials;
  check('réseau vide → null sur le site (bouton masqué)', Object.values(social0).every((v) => v === null), social0);
  const mix = await call('PATCH', '/admin/info', {
    github: 'https://github.com/Rayane-62',          // lien complet
    instagram: '@rayane.dev',                         // avec l'arobase
    linkedin: 'rayane-benlalam',                      // pseudo simple
    x: 'https://x.com/rayane_dev?utm_source=site',    // lien avec des paramètres
    youtube: 'https://www.youtube.com/@rayanedev/videos',
    behance: 'www.behance.net/rayane',
  });
  check('lien complet accepté → pseudo gardé', mix.data.github === 'Rayane-62', mix.data.github);
  check('arobase retirée', mix.data.instagram === 'rayane.dev', mix.data.instagram);
  check('paramètres du lien retirés', mix.data.x === 'rayane_dev', mix.data.x);
  const socialMix = (await call('GET', '/public/portfolio', null, false)).data.info.socials;
  check('le site reçoit des liens complets', socialMix.github === 'https://github.com/Rayane-62' && socialMix.linkedin === 'https://www.linkedin.com/in/rayane-benlalam', socialMix);
  check('chaîne YouTube : « @pseudo »', socialMix.youtube === 'https://www.youtube.com/@rayanedev', socialMix.youtube);
  check('réseaux non remplis toujours null', socialMix.facebook === null && socialMix.dribbble === null, socialMix);
  check('e-mail invalide refusé (400)', (await call('PATCH', '/admin/info', { email: 'pas-un-email' })).status === 400);
  check('nom vide refusé (400)', (await call('PATCH', '/admin/info', { name: '   ' })).status === 400);
  check('chiffre négatif refusé (400)', (await call('PATCH', '/admin/info', { statsProjects: -2 })).status === 400);
  const dispo = await call('PATCH', '/admin/info', { available: false });
  check('disponibilité modifiable', dispo.data.available === false && (await call('GET', '/public/portfolio', null, false)).data.info.available === false);
  await call('PATCH', '/admin/info', { available: info0.available });

  console.log('\nCompétences');
  const skills0 = (await call('GET', '/admin/skills')).data;
  check('les 36 compétences reprises de Strapi sont là', skills0.length >= 36, skills0.length);
  const skill = await call('POST', '/admin/skills', { name: 'Smoke Framework', iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg', category: 'frontend' });
  check('création compétence', skill.status === 201 && skill.data.category === 'frontend', skill.data);
  check('compétence en double refusée (409)', (await call('POST', '/admin/skills', { name: 'smoke framework', category: 'tools' })).status === 409);
  check('catégorie inconnue refusée (400)', (await call('POST', '/admin/skills', { name: 'Smoke X', category: 'design' })).status === 400);
  check('nom vide refusé (400)', (await call('POST', '/admin/skills', { name: ' ', category: 'tools' })).status === 400);
  check('logo invalide refusé (400)', (await call('POST', '/admin/skills', { name: 'Smoke Y', iconUrl: 'devicon.svg', category: 'tools' })).status === 400);
  const skillUp = await call('PATCH', `/admin/skills/${skill.data.id}`, { category: 'tools', name: 'Smoke Outil' });
  check('modifier une compétence', skillUp.data.category === 'tools' && skillUp.data.name === 'Smoke Outil', skillUp.data);
  const grouped = (await call('GET', '/public/portfolio', null, false)).data.skills;
  check('la compétence apparaît dans sa catégorie sur le site', grouped.tools.some((s) => s.name === 'Smoke Outil'), grouped.tools);
  const ids = (await call('GET', '/admin/skills')).data.map((s) => s.id);
  const reordered = await call('PUT', '/admin/skills/order', { ids: [...ids].reverse() });
  check('réordonner les compétences', reordered.status === 200 && reordered.data[0].id === ids[ids.length - 1], reordered.data.slice(0, 2));
  await call('PUT', '/admin/skills/order', { ids });
  check('ordre d’origine rétabli', (await call('GET', '/admin/skills')).data[0].id === ids[0]);
  check('lire une compétence', (await call('GET', `/admin/skills/${skill.data.id}`)).data.name === 'Smoke Outil');
  check('compétence introuvable (404)', (await call('PATCH', '/admin/skills/999999', { name: 'X' })).status === 404);

  console.log('\nParcours professionnel');
  const exps0 = (await call('GET', '/admin/experiences')).data;
  check('les 2 expériences reprises de Strapi sont là', exps0.length >= 2, exps0.length);
  check('technologies reprises en tableau', exps0.some((e) => Array.isArray(e.technologies) && e.technologies.includes('Angular')), exps0.map((e) => e.technologies));
  const exp = await call('POST', '/admin/experiences', {
    position: 'Développeur Smoke', positionEn: 'Smoke Developer', company: 'Smoke SARL', period: 'Janvier 2026',
    description: 'Poste de test.', technologies: [' NestJS ', 'React', ''], current: true,
  });
  check('création expérience', exp.status === 201 && exp.data.current === true, exp.data);
  check('technologies nettoyées', exp.data.technologies.join() === 'NestJS,React', exp.data.technologies);
  check('poste vide refusé (400)', (await call('POST', '/admin/experiences', { position: '', company: 'X', period: '2026' })).status === 400);
  check('entreprise manquante refusée (400)', (await call('POST', '/admin/experiences', { position: 'X', period: '2026' })).status === 400);
  const expEn = (await call('GET', '/public/portfolio?locale=en', null, false)).data.experiences.find((e) => e.id === exp.data.id);
  check('expérience traduite sur le site anglais', expEn?.position === 'Smoke Developer' && expEn?.company === 'Smoke SARL', expEn);
  const expUp = await call('PATCH', `/admin/experiences/${exp.data.id}`, { current: false, positionEs: 'Desarrollador Smoke' });
  check('modifier une expérience', expUp.data.current === false && expUp.data.positionEs === 'Desarrollador Smoke', expUp.data);
  check('traduction vidée = null', (await call('PATCH', `/admin/experiences/${exp.data.id}`, { positionEs: '' })).data.positionEs === null);
  const expIds = (await call('GET', '/admin/experiences')).data.map((e) => e.id);
  const expOrder = await call('PUT', '/admin/experiences/order', { ids: [...expIds].reverse() });
  check('réordonner les expériences', expOrder.data[0].id === expIds[expIds.length - 1], expOrder.data.map((e) => e.id));
  await call('PUT', '/admin/experiences/order', { ids: expIds });

  console.log('\nFormation');
  const edu = await call('POST', '/admin/educations', {
    degree: 'Diplôme Smoke', degreeEn: 'Smoke Degree', institution: 'USTHB', period: '2026 - 2027', current: true,
  });
  check('création formation', edu.status === 201 && edu.data.current === true, edu.data);
  check('description facultative absente = null', edu.data.description === null, edu.data.description);
  check('diplôme vide refusé (400)', (await call('POST', '/admin/educations', { degree: '', institution: 'X', period: '2026' })).status === 400);
  const eduUp = await call('PATCH', `/admin/educations/${edu.data.id}`, { description: 'Mémoire en cours.', current: false });
  check('modifier une formation', eduUp.data.description === 'Mémoire en cours.' && eduUp.data.current === false, eduUp.data);
  const eduIds = (await call('GET', '/admin/educations')).data.map((e) => e.id);
  const eduOrder = await call('PUT', '/admin/educations/order', { ids: [...eduIds].reverse() });
  check('réordonner les formations', eduOrder.data[0].id === eduIds[eduIds.length - 1], eduOrder.data.map((e) => e.id));
  await call('PUT', '/admin/educations/order', { ids: eduIds });

  console.log('\nProjets');
  const projets0 = (await call('GET', '/admin/projects')).data;
  check('la table des projets part vide', Array.isArray(projets0) && projets0.length === 0, projets0.length);
  const proj = await call('POST', '/admin/projects', {
    title: 'Smoke Boutique', titleEn: 'Smoke Shop', titleAr: 'متجر سموك',
    description: 'Site e-commerce de test.', descriptionEn: 'Test e-commerce site.',
    category: 'web', technologies: ['Next.js', 'NestJS'], liveUrl: 'https://smoke.example.com',
    githubUrl: 'https://github.com/Rayane-62/smoke', featured: true,
  });
  check('création projet', proj.status === 201 && proj.data.category === 'web' && proj.data.visible === true, proj.data);
  check('catégorie inconnue refusée (400)', (await call('POST', '/admin/projects', { title: 'X', category: 'jeu' })).status === 400);
  check('titre vide refusé (400)', (await call('POST', '/admin/projects', { title: '  ', category: 'web' })).status === 400);
  check('lien sans https refusé (400)', (await call('POST', '/admin/projects', { title: 'X', category: 'web', liveUrl: 'smoke.example.com' })).status === 400);
  const proj2 = await call('POST', '/admin/projects', { title: 'Smoke Appli', category: 'mobile', technologies: ['Kotlin'] });
  check('2e projet (mobile)', proj2.status === 201 && proj2.data.category === 'mobile', proj2.data);
  const pubProj = (await call('GET', '/public/portfolio?locale=en', null, false)).data.projects;
  check('projets visibles sur le site, mis en avant d’abord', pubProj[0].title === 'Smoke Shop' && pubProj.length === 2, pubProj.map((p) => p.title));
  check('projet traduit (arabe) avec repli', (await call('GET', '/public/portfolio?locale=ar', null, false)).data.projects.find((p) => p.id === proj.data.id)?.title === 'متجر سموك');
  const hidden = await call('PATCH', `/admin/projects/${proj2.data.id}/visible`, { visible: false });
  check('masquer un projet', hidden.data.visible === false && (await call('GET', '/public/portfolio', null, false)).data.projects.length === 1);
  check('masqué : toujours dans l’admin', (await call('GET', '/admin/projects?filter=masque')).data.length === 1);
  await call('PATCH', `/admin/projects/${proj2.data.id}/visible`, { visible: true });
  check('filtre par catégorie', (await call('GET', '/admin/projects?category=mobile')).data.length === 1);
  const projIds = (await call('GET', '/admin/projects')).data.map((p) => p.id);
  const projOrder = await call('PUT', '/admin/projects/order', { ids: [...projIds].reverse() });
  check('réordonner les projets', projOrder.data[0].id === projIds[projIds.length - 1], projOrder.data.map((p) => p.id));

  console.log('\nFormulaire de contact');
  const sent = await call('POST', '/public/contact', contact(), false, undefined, '91.0.0.1');
  check('message envoyé', sent.status === 201 && sent.data.ok === true, sent.data);
  check('e-mail invalide refusé (400)', (await call('POST', '/public/contact', contact({ email: 'rayane@' }), false, undefined, '91.0.0.2')).status === 400);
  check('nom vide refusé (400)', (await call('POST', '/public/contact', contact({ name: ' ' }), false, undefined, '91.0.0.3')).status === 400);
  check('objet vide refusé (400)', (await call('POST', '/public/contact', contact({ subject: '' }), false, undefined, '91.0.0.4')).status === 400);
  check('message trop court refusé (400)', (await call('POST', '/public/contact', contact({ message: 'Salut' }), false, undefined, '91.0.0.5')).status === 400);
  check('téléphone facultatif : sans numéro ça passe', (await call('POST', '/public/contact', contact({ phone: undefined, subject: 'Smoke sans numéro' }), false, undefined, '91.0.0.6')).status === 201);
  check('téléphone trop long refusé (400)', (await call('POST', '/public/contact', contact({ phone: '0'.repeat(31) }), false, undefined, '91.0.0.7')).status === 400);
  // 10 messages par 10 minutes et par IP : le 11e est refusé.
  let dernier = { status: 0 };
  for (let i = 0; i < 10; i++) dernier = await call('POST', '/public/contact', contact({ subject: `Smoke limite ${i}` }), false, undefined, '91.0.0.9');
  check('10 messages de suite acceptés', dernier.status === 201, dernier.data);
  check('11e message de la même IP refusé (429)', (await call('POST', '/public/contact', contact(), false, undefined, '91.0.0.9')).status === 429);
  check('une autre IP passe toujours', (await call('POST', '/public/contact', contact({ subject: 'Smoke autre IP' }), false, undefined, '91.0.0.10')).status === 201);

  console.log('\nMessages reçus (admin)');
  const inbox = await call('GET', '/admin/messages');
  check('liste des messages', inbox.status === 200 && inbox.data.items.length >= 12, inbox.data.total);
  check('du plus récent au plus ancien', inbox.data.items.every((m, i, a) => i === 0 || a[i - 1].createdAt >= m.createdAt));
  check('compteur de non lus', inbox.data.unread === inbox.data.total, [inbox.data.unread, inbox.data.total]);
  const first = inbox.data.items[0];
  check('contenu du message gardé', first.email === 'visiteur@example.com' && first.message.includes('site vitrine'), first);
  const read = await call('PATCH', `/admin/messages/${first.id}/read`, { read: true });
  check('marquer comme lu', read.data.read === true, read.data);
  check('filtre « non lus »', (await call('GET', '/admin/messages?filter=nonlus')).data.items.every((m) => m.read === false));
  check('remettre en non lu', (await call('PATCH', `/admin/messages/${first.id}/read`, { read: false })).data.read === false);
  check('message introuvable (404)', (await call('PATCH', '/admin/messages/999999/read', { read: true })).status === 404);

  console.log('\nTableau de bord');
  const dash = await call('GET', '/admin/dashboard');
  check('GET /admin/dashboard', dash.status === 200 && !!dash.data.counts, dash.data);
  check('nombre de projets', dash.data.counts.projects === 2, dash.data.counts);
  check('nombre de compétences', dash.data.counts.skills === skills0.length + 1, dash.data.counts);
  check('messages non lus comptés', dash.data.counts.unreadMessages === dash.data.counts.messages, dash.data.counts);
  check('derniers messages (5 maximum)', dash.data.lastMessages.length === 5, dash.data.lastMessages.length);
  check('rappels : il manque encore la photo et le CV', dash.data.todo.photo === true && dash.data.todo.cv === true, dash.data.todo);

  console.log('\nFlux en direct (SSE)');
  const sse = await fetch(`${API}/admin/events`, { headers: { Authorization: `Bearer ${token}` } });
  check('GET /admin/events ouvre un flux', sse.status === 200 && sse.headers.get('content-type')?.includes('text/event-stream'), sse.headers.get('content-type'));
  const reader = sse.body.getReader();
  const hello = new TextDecoder().decode((await reader.read()).value);
  check('premier message du flux', hello.includes('hello'), hello);
  const attendu = (async () => {
    const deadline = Date.now() + 5000;
    let buffer = '';
    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += new TextDecoder().decode(value);
      if (buffer.includes('message.created')) return buffer;
    }
    return buffer;
  })();
  await call('POST', '/public/contact', contact({ subject: 'Smoke direct' }), false, undefined, '91.0.0.11');
  check('un message reçu arrive dans le flux', (await attendu).includes('message.created'));
  await reader.cancel();

  console.log('\nFichiers envoyés');
  const png = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: '#1f6feb' } }).png().toBuffer();
  const img = await call('POST', '/admin/uploads?kind=project', null, true, upload(png, 'image/png', 'projet.png'));
  check('envoi image de projet (PNG)', img.status === 201 && img.data.publicId?.startsWith('local:'), img.data);
  const meta = await sharp(Buffer.from(await (await fetch(img.data.url)).arrayBuffer())).metadata();
  check('image convertie en WebP 1600 px max', meta.format === 'webp' && meta.width === 1600 && meta.height === 1200, meta);
  const photo = await call('POST', '/admin/uploads?kind=photo', null, true, upload(png, 'image/png', 'moi.png'));
  const photoMeta = await sharp(Buffer.from(await (await fetch(photo.data.url)).arrayBuffer())).metadata();
  check('photo de profil convertie en WebP 1200 px max', photoMeta.format === 'webp' && photoMeta.width === 1200, photoMeta);
  check('faux fichier refusé (400)', (await call('POST', '/admin/uploads?kind=project', null, true, upload(Buffer.from('pas une image du tout'), 'image/png', 'x.png'))).status === 400);
  check('fichier manquant refusé (400)', (await call('POST', '/admin/uploads?kind=project', null, true, new FormData())).status === 400);
  const cv = await call('POST', '/admin/uploads?kind=cv', null, true, upload(fakePdf(), 'application/pdf', 'cv.pdf'));
  check('envoi du CV (PDF gardé tel quel)', cv.status === 201 && cv.data.url.endsWith('.pdf'), cv.data);
  const cvFile = await fetch(cv.data.url);
  check('CV téléchargeable', cvFile.status === 200 && (await cvFile.text()).startsWith('%PDF-'), cvFile.status);
  check('image refusée comme CV (400)', (await call('POST', '/admin/uploads?kind=cv', null, true, upload(png, 'image/png', 'moi.png'))).status === 400);
  check('PDF refusé comme image (400)', (await call('POST', '/admin/uploads?kind=project', null, true, upload(fakePdf(), 'application/pdf', 'cv.pdf'))).status === 400);
  const withFiles = await call('PATCH', '/admin/info', {
    photoUrl: photo.data.url, photoPublicId: photo.data.publicId, cvUrl: cv.data.url, cvPublicId: cv.data.publicId,
  });
  check('photo et CV attachés aux informations', withFiles.data.photoUrl === photo.data.url && withFiles.data.cvUrl === cv.data.url, withFiles.data.photoUrl);
  const pubFiles = (await call('GET', '/public/portfolio', null, false)).data.info;
  check('le site reçoit la photo et le CV', pubFiles.photoUrl === photo.data.url && pubFiles.cvUrl === cv.data.url, pubFiles.photoUrl);
  const projImg = await call('PATCH', `/admin/projects/${proj.data.id}`, { imageUrl: img.data.url, imagePublicId: img.data.publicId });
  check('image attachée au projet', projImg.data.imageUrl === img.data.url);
  await call('PATCH', '/admin/info', { photoUrl: null, photoPublicId: null, cvUrl: null, cvPublicId: null });
  check('photo retirée = fichier supprimé', (await fetch(photo.data.url)).status === 404);
  check('CV retiré = fichier supprimé', (await fetch(cv.data.url)).status === 404);

  console.log('\nMon compte');
  const prof = await call('PATCH', '/admin/auth/profile', { firstName: 'Smoke', lastName: 'Test', login: LOGIN });
  check('profil modifié', prof.data.firstName === 'Smoke', prof.data);
  check('mot de passe actuel faux refusé (400)', (await call('PATCH', '/admin/auth/password', { currentPassword: 'faux', newPassword: 'NouveauMdp123' })).status === 400);
  check('nouveau mot de passe trop court refusé (400)', (await call('PATCH', '/admin/auth/password', { currentPassword: PASSWORD, newPassword: 'court' })).status === 400);
  check('même mot de passe refusé (400)', (await call('PATCH', '/admin/auth/password', { currentPassword: PASSWORD, newPassword: PASSWORD })).status === 400);
  const oldToken = token;
  const pw = await call('PATCH', '/admin/auth/password', { currentPassword: PASSWORD, newPassword: 'SmokeTemp123' });
  check('mot de passe changé (nouveau jeton)', pw.status === 200 && !!pw.data.token, pw.data);
  token = oldToken;
  check('ancien jeton refusé', (await call('GET', '/admin/auth/me')).status === 401);
  token = pw.data.token;
  check('changement effectué : plus de mot de passe à changer', (await call('GET', '/admin/auth/me')).data.mustChangePassword === false);
  await call('PATCH', '/admin/auth/password', { currentPassword: 'SmokeTemp123', newPassword: PASSWORD });
  token = (await call('POST', '/admin/auth/login', { login: LOGIN, password: PASSWORD }, false)).data.token;
  await call('PATCH', '/admin/auth/profile', { firstName: me.data.firstName, lastName: me.data.lastName, login: me.data.login });

  console.log('\nNettoyage');
  for (const m of (await call('GET', '/admin/messages?limit=200')).data.items) {
    if (m.name === 'Smoke Visiteur') await call('DELETE', `/admin/messages/${m.id}`);
  }
  check('messages de test supprimés', (await call('GET', '/admin/messages?limit=200')).data.items.filter((m) => m.name === 'Smoke Visiteur').length === 0);
  check('supprimer le projet (son image aussi)', (await call('DELETE', `/admin/projects/${proj.data.id}`)).status === 200);
  check('image du projet supprimée du serveur', (await fetch(img.data.url)).status === 404);
  await call('DELETE', `/admin/projects/${proj2.data.id}`);
  check('tous les projets de test supprimés', (await call('GET', '/admin/projects')).data.length === 0);
  check('supprimer la compétence', (await call('DELETE', `/admin/skills/${skill.data.id}`)).status === 200);
  check('supprimer l’expérience', (await call('DELETE', `/admin/experiences/${exp.data.id}`)).status === 200);
  check('supprimer la formation', (await call('DELETE', `/admin/educations/${edu.data.id}`)).status === 200);
  check('contenu repris de Strapi intact', (await call('GET', '/admin/skills')).data.length === skills0.length && (await call('GET', '/admin/experiences')).data.length === exps0.length, [skills0.length, exps0.length]);
  // Réseaux : on remet ce qu'il y avait avant le test.
  await call('PATCH', '/admin/info', {
    github: info0.github ?? '', linkedin: info0.linkedin ?? '', instagram: info0.instagram ?? '', facebook: info0.facebook ?? '',
    x: info0.x ?? '', youtube: info0.youtube ?? '', behance: info0.behance ?? '', dribbble: info0.dribbble ?? '',
  });
  check('réseaux d’origine rétablis', (await call('GET', '/admin/info')).data.github === info0.github);

  console.log(`\n${passed} réussi(s), ${failures.length} échec(s)`);
  if (failures.length) {
    console.log('Échecs :', failures);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
