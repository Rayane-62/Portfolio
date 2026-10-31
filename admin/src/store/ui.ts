import { create } from 'zustand';

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  /** Fenêtre d'information seulement (un seul bouton). */
  infoOnly?: boolean;
  resolve: (ok: boolean) => void;
}

interface UiState {
  toast: { text: string; tone: 'ok' | 'error' | 'new' } | null;
  confirmReq: ConfirmRequest | null;
  menuOpen: boolean;
  setMenu: (v: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  toast: null,
  confirmReq: null,
  menuOpen: false,
  setMenu: (menuOpen) => set({ menuOpen }),
}));

let timer: ReturnType<typeof setTimeout> | undefined;

/** Petite notification en bas de l'écran. */
export function toast(text: string, tone: 'ok' | 'error' | 'new' = 'ok', durationMs?: number) {
  clearTimeout(timer);
  useUi.setState({ toast: { text, tone } });
  timer = setTimeout(() => useUi.setState({ toast: null }), durationMs ?? (tone === 'error' ? 4500 : 2600));
}

/** Demande de confirmation : `if (await confirm({...})) …` */
export function confirm(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => useUi.setState({ confirmReq: { ...opts, resolve } }));
}
