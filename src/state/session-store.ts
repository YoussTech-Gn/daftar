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

export interface OperationSheetState {
  kind: 'credit' | 'payment';
  customerId: number | null;
  /** Opening time: keys the form so each opening starts fresh. */
  openedAt: number;
}

interface SessionState {
  /**
   * Bumped after every write made from a sheet over the tabs (decision 0018). Accueil, Clients and
   * Rapports reload when it changes, because a sheet does not change screen focus.
   */
  ledgerVersion: number;
  bumpLedger: () => void;
  /** "Nouvelle opération" bottom sheet; null when closed. */
  operation: OperationSheetState | null;
  openOperation: (op?: Partial<Omit<OperationSheetState, 'openedAt'>>) => void;
  closeOperation: () => void;
  newCustomerOpen: boolean;
  setNewCustomerOpen: (open: boolean) => void;
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
  ledgerVersion: 0,
  bumpLedger: () => set((st) => ({ ledgerVersion: st.ledgerVersion + 1 })),
  operation: null,
  openOperation: (op) => set({ operation: { kind: op?.kind ?? 'credit', customerId: op?.customerId ?? null, openedAt: Date.now() } }),
  closeOperation: () => set({ operation: null }),
  newCustomerOpen: false,
  setNewCustomerOpen: (open) => set({ newCustomerOpen: open }),
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
