import { create } from 'zustand';

import type { EntryKind } from '@/domain/types';

export interface SavedEntryHighlight {
  id: number;
  kind: EntryKind;
  customerId: number;
  at: number;
}

export interface ToastMessage {
  id: number;
  message: string;
}

interface SessionState {
  lastSavedEntry: SavedEntryHighlight | null;
  toast: ToastMessage | null;
  /** "Hide amounts" eye: masks balances while a customer looks at the screen. Resets on restart. */
  amountsHidden: boolean;
  toggleAmountsHidden: () => void;
  markSavedEntry: (entry: Omit<SavedEntryHighlight, 'at'>) => void;
  clearSavedEntry: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

let toastSeq = 0;

/** Ephemeral UI session state: highlights newly saved ledger rows and displays custom in-app toasts. */
export const useSessionStore = create<SessionState>()((set) => ({
  lastSavedEntry: null,
  toast: null,
  amountsHidden: false,
  toggleAmountsHidden: () => set((st) => ({ amountsHidden: !st.amountsHidden })),
  markSavedEntry: (entry) => set({ lastSavedEntry: { ...entry, at: Date.now() } }),
  clearSavedEntry: () => set({ lastSavedEntry: null }),
  showToast: (message) => {
    toastSeq += 1;
    set({ toast: { id: toastSeq, message } });
  },
  clearToast: () => set({ toast: null }),
}));
