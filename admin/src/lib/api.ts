import { useAuth } from '@/store/auth';

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4300').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Appel à l'API admin avec le jeton de connexion. Déconnecte automatiquement si la session a expiré. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = useAuth.getState().token;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur. Vérifie que l'API est lancée.", 0);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const raw = (data as { message?: string | string[] } | null)?.message;
    const msg = Array.isArray(raw) ? raw[0] : raw;
    // 401 sur une route protégée = session expirée ou mot de passe changé → retour à la connexion.
    if (res.status === 401 && token && !path.startsWith('/admin/auth/login')) useAuth.getState().logout();
    if (res.status === 429) throw new ApiError('Trop de tentatives. Patiente quelques minutes.', 429, data);
    throw new ApiError(msg || 'Une erreur est survenue', res.status, data);
  }
  return data as T;
}

/**
 * Envoi d'un fichier → { url, publicId }.
 * `photo` et `project` sont converties en WebP par l'API, `cv` est un PDF gardé tel quel.
 */
export async function upload(file: File, kind: 'photo' | 'project' | 'cv') {
  const body = new FormData();
  body.append('file', file);
  return api<{ url: string; publicId: string }>(`/admin/uploads?kind=${kind}`, { method: 'POST', body });
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Une erreur est survenue');
