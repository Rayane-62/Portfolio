import { createHash } from 'node:crypto';

/**
 * Stockage Cloudinary (offre gratuite) pour l'hébergement sans disque permanent (Render…).
 * Activé dès que CLOUDINARY_URL est défini : cloudinary://<api_key>:<api_secret>@<cloud_name>
 * (la valeur « API environment variable » du tableau de bord Cloudinary).
 * Appels directs à l'API REST, sans dépendance.
 */
export type CloudinaryResource = 'image' | 'raw';

export interface CloudinaryConfig {
  cloud: string;
  key: string;
  secret: string;
}

export function parseCloudinaryUrl(url: string | undefined): CloudinaryConfig | null {
  if (!url?.trim()) return null;
  const u = new URL(url.trim());
  if (u.protocol !== 'cloudinary:' || !u.hostname || !u.username || !u.password) {
    throw new Error('CLOUDINARY_URL invalide : attendu cloudinary://<api_key>:<api_secret>@<cloud_name>');
  }
  return { cloud: u.hostname, key: decodeURIComponent(u.username), secret: decodeURIComponent(u.password) };
}

/** Signature Cloudinary : paramètres triés « a=1&b=2 » + secret, en SHA-1. */
function sign(params: Record<string, string>, secret: string) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(base + secret).digest('hex');
}

async function post(cfg: CloudinaryConfig, path: string, params: Record<string, string>, file?: Buffer) {
  const signed = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const body = new FormData();
  for (const [k, v] of Object.entries(signed)) body.append(k, v);
  body.append('api_key', cfg.key);
  body.append('signature', sign(signed, cfg.secret));
  if (file) body.append('file', new Blob([new Uint8Array(file)]));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/${path}`, { method: 'POST', body });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Cloudinary : erreur ${res.status}`);
  return json;
}

export async function cloudinaryUpload(cfg: CloudinaryConfig, resource: CloudinaryResource, publicId: string, data: Buffer) {
  const r = await post(cfg, `${resource}/upload`, { public_id: publicId, overwrite: 'false' }, data);
  return { url: String(r.secure_url), width: Number(r.width ?? 0), height: Number(r.height ?? 0) };
}

export async function cloudinaryDestroy(cfg: CloudinaryConfig, resource: CloudinaryResource, publicId: string) {
  await post(cfg, `${resource}/destroy`, { public_id: publicId, invalidate: 'true' });
}

/** Infos d'une image déjà envoyée (API d'administration). NULL = introuvable. */
export async function cloudinaryImage(cfg: CloudinaryConfig, publicId: string) {
  const auth = Buffer.from(`${cfg.key}:${cfg.secret}`).toString('base64');
  const path = publicId.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/resources/image/upload/${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cloudinary : erreur ${res.status}`);
  const r = (await res.json()) as { secure_url: string; width: number; height: number };
  return { url: r.secure_url, width: r.width, height: r.height };
}
