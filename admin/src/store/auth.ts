import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Me } from '@/lib/types';

interface AuthState {
  token: string | null;
  me: Me | null;
  setSession: (token: string, me: Me) => void;
  setMe: (me: Me) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

/** Session gardée dans le navigateur : l'admin reste connecté (7 jours par défaut, réglable dans l'API). */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      me: null,
      setSession: (token, me) => set({ token, me }),
      setMe: (me) => set({ me }),
      setToken: (token) => set({ token }),
      logout: () => set({ token: null, me: null }),
    }),
    { name: 'portfolio-admin-session' },
  ),
);
