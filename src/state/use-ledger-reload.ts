import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useSessionStore } from '@/state/session-store';

/**
 * Runs `load` when the screen gains focus and whenever the ledger changes from a sheet
 * (decision 0018): Accueil, Clients and Rapports stay in sync without a navigation.
 */
export function useLedgerReload(load: () => void | Promise<void>) {
  const version = useSessionStore((s) => s.ledgerVersion);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void loadRef.current();
    }, []),
  );

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void loadRef.current();
  }, [version]);
}
