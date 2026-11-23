/**
 * How the shopkeeper reads the ledger: which row is a real payment,
 * which customer should sit higher in the "who owes me" list, and
 * which avatar tint belongs to a person.
 */

/** Forgiveness is not money received, and a cancelled payment no longer counts. */
export function isReceivedPayment(entry: { kind: string; cancelledAt?: number | null }): boolean {
  return entry.kind === 'payment' && entry.cancelledAt == null;
}

/**
 * Latest real payment. `listEntries` returns newest first, so the first match is the latest.
 */
export function latestPayment<T extends { kind: string; cancelledAt?: number | null }>(
  entries: readonly T[],
): T | undefined {
  return entries.find(isReceivedPayment);
}

export interface DebtListItem {
  balance: number;
  lastActivityAt: number | null;
  name: string;
}

/**
 * Biggest balance first (largest debt, then settled, then advances).
 * Equal balances: the quietest one rises, so an old debt is not buried under one that moved today.
 */
export function compareByDebt(a: DebtListItem, b: DebtListItem): number {
  if (a.balance !== b.balance) return b.balance - a.balance;
  const aAt = a.lastActivityAt ?? 0;
  const bAt = b.lastActivityAt ?? 0;
  if (aAt !== bAt) return aAt - bAt;
  return a.name.localeCompare(b.name);
}

/** FNV-1a. Same seed always lands on the same slot. */
export function avatarTintIndex(seed: string, paletteSize: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const size = paletteSize > 0 ? paletteSize : 1;
  return (h >>> 0) % size;
}

/**
 * One shortcut per ledger row, so a swipe and a press never disagree.
 * A live entry — including a payment that cleared the balance — only offers delete.
 * A cancelled entry only offers restore.
 */
export function rowShortcut(cancelled: boolean): 'delete' | 'restore' {
  return cancelled ? 'restore' : 'delete';
}

/** Prefer the customer id so a rename, or a shared name, does not recolour the avatar. */
export function avatarSeed(id: number | string | undefined, name: string): string {
  if (id !== undefined && id !== null && String(id) !== '') return `id:${id}`;
  return `name:${name.trim() || '?'}`;
}
