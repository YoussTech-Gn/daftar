import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ActivityAction,
  ActivityEntry,
  CreditType,
  Customer,
  CustomerWithBalance,
  Entry,
  EntryItem,
  EntryKind,
  PaymentMethod,
  Product,
  ProductUnit,
  Summary,
} from '@/domain/types';

interface CustomerRow {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  deleted_at: number | null;
  created_at: number;
  balance: number | null;
  last_activity_at: number | null;
}

interface EntryRow {
  id: number;
  customer_id: number;
  kind: EntryKind;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  credit_type: CreditType | null;
  cancelled_at: number | null;
  cancel_reason: string | null;
  created_at: number;
}

interface ProductRow {
  id: number;
  name: string;
  price: number;
  unit: ProductUnit;
  use_count: number;
}

interface EntryItemRow {
  entry_id: number;
  product_id: number | null;
  name: string;
  unit: ProductUnit;
  qty: number;
  unit_price: number;
  total: number;
}

interface ActivityRow {
  id: number;
  at: number;
  action: ActivityAction;
  customer_id: number | null;
  customer_name: string | null;
  entry_id: number | null;
  amount: number | null;
  details: string | null;
}

/** Customers in the trash longer than this are permanently removed (decision 0013). */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function toItem(row: EntryItemRow): EntryItem {
  return {
    productId: row.product_id,
    name: row.name,
    unit: row.unit,
    qty: row.qty,
    unitPrice: row.unit_price,
    total: row.total,
  };
}

/** Balance = credits − payments − forgiven, ignoring cancelled entries. */
const CUSTOMER_SQL = `
  SELECT c.id, c.name, c.phone, c.note, c.deleted_at, c.created_at,
    COALESCE(SUM(CASE WHEN e.kind = 'credit' THEN e.amount ELSE -e.amount END), 0) AS balance,
    MAX(e.created_at) AS last_activity_at
  FROM customers c
  LEFT JOIN entries e ON e.customer_id = c.id AND e.cancelled_at IS NULL
  WHERE c.archived = 0`;

const ACTIVE = 'AND c.deleted_at IS NULL';

function toCustomer(row: CustomerRow): CustomerWithBalance {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    note: row.note,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    balance: row.balance ?? 0,
    lastActivityAt: row.last_activity_at,
  };
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    customerId: row.customer_id,
    kind: row.kind,
    amount: row.amount,
    method: row.method,
    note: row.note,
    creditType: row.credit_type,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
  };
}

function toProduct(row: ProductRow): Product {
  return { id: row.id, name: row.name, price: row.price, unit: row.unit ?? 'piece', useCount: row.use_count };
}

// ── Activity log ────────────────────────────────────────────────────────────

export async function logActivity(
  db: SQLiteDatabase,
  action: ActivityAction,
  data: { customerId?: number | null; entryId?: number | null; amount?: number | null; details?: string | null } = {},
): Promise<void> {
  await db.runAsync(
    'INSERT INTO activity_log (at, action, customer_id, entry_id, amount, details) VALUES (?, ?, ?, ?, ?, ?)',
    [Date.now(), action, data.customerId ?? null, data.entryId ?? null, data.amount ?? null, data.details ?? null],
  );
}

/** Most recent first. Customer names are joined live (details keep the name for purged customers). */
export async function listActivity(db: SQLiteDatabase, limit = 200): Promise<ActivityEntry[]> {
  const rows = await db.getAllAsync<ActivityRow>(
    `SELECT a.id, a.at, a.action, a.customer_id, c.name AS customer_name, a.entry_id, a.amount, a.details
     FROM activity_log a LEFT JOIN customers c ON c.id = a.customer_id
     ORDER BY a.at DESC, a.id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    at: r.at,
    action: r.action,
    customerId: r.customer_id,
    customerName: r.customer_name,
    entryId: r.entry_id,
    amount: r.amount,
    details: r.details,
  }));
}

// ── Customers ───────────────────────────────────────────────────────────────

export async function listCustomers(db: SQLiteDatabase, search = ''): Promise<CustomerWithBalance[]> {
  const term = search.trim();
  const order = 'GROUP BY c.id ORDER BY balance DESC, last_activity_at DESC, c.name';
  const rows = term
    ? await db.getAllAsync<CustomerRow>(
        `${CUSTOMER_SQL} ${ACTIVE} AND (c.name LIKE ? OR c.phone LIKE ? OR c.note LIKE ?) ${order}`,
        [`%${term}%`, `%${term}%`, `%${term}%`],
      )
    : await db.getAllAsync<CustomerRow>(`${CUSTOMER_SQL} ${ACTIVE} ${order}`);
  return rows.map(toCustomer);
}

/** Returns the customer even if in the trash (the page shows a banner then). */
export async function getCustomer(db: SQLiteDatabase, id: number): Promise<CustomerWithBalance | null> {
  const row = await db.getFirstAsync<CustomerRow>(`${CUSTOMER_SQL} AND c.id = ? GROUP BY c.id`, [id]);
  return row ? toCustomer(row) : null;
}

export async function countCustomers(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM customers WHERE archived = 0 AND deleted_at IS NULL',
  );
  return row?.n ?? 0;
}

export interface CustomerInput {
  name: string;
  phone: string | null;
  note: string | null;
}

export async function createCustomer(db: SQLiteDatabase, input: CustomerInput): Promise<number> {
  const result = await db.runAsync('INSERT INTO customers (name, phone, note, created_at) VALUES (?, ?, ?, ?)', [
    input.name.trim(),
    input.phone?.trim() || null,
    input.note?.trim() || null,
    Date.now(),
  ]);
  await logActivity(db, 'customer_add', { customerId: result.lastInsertRowId });
  return result.lastInsertRowId;
}

export async function updateCustomer(db: SQLiteDatabase, id: number, input: CustomerInput): Promise<void> {
  await db.runAsync('UPDATE customers SET name = ?, phone = ?, note = ? WHERE id = ?', [
    input.name.trim(),
    input.phone?.trim() || null,
    input.note?.trim() || null,
    id,
  ]);
  await logActivity(db, 'customer_edit', { customerId: id });
}

/** Moves a customer to the trash. Nothing is erased; restorable for 30 days. */
export async function trashCustomer(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE customers SET deleted_at = ? WHERE id = ?', [Date.now(), id]);
  await logActivity(db, 'customer_trash', { customerId: id });
}

export async function restoreCustomer(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE customers SET deleted_at = NULL WHERE id = ?', [id]);
  await logActivity(db, 'customer_restore', { customerId: id });
}

export async function listTrash(db: SQLiteDatabase): Promise<CustomerWithBalance[]> {
  const rows = await db.getAllAsync<CustomerRow>(
    `${CUSTOMER_SQL} AND c.deleted_at IS NOT NULL GROUP BY c.id ORDER BY c.deleted_at DESC`,
  );
  return rows.map(toCustomer);
}

/** Permanently removes one customer and all their entries. */
async function purgeCustomer(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM entry_items WHERE entry_id IN (SELECT id FROM entries WHERE customer_id = ?)',
      [id],
    );
    await db.runAsync('DELETE FROM entries WHERE customer_id = ?', [id]);
    await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
    await logActivity(db, 'customer_purge', { customerId: id, details: name });
  });
}

/** Removes customers that stayed in the trash longer than the retention period. Returns how many. */
export async function purgeExpiredTrash(db: SQLiteDatabase, now = Date.now()): Promise<number> {
  const expired = await db.getAllAsync<{ id: number; name: string }>(
    'SELECT id, name FROM customers WHERE deleted_at IS NOT NULL AND deleted_at < ?',
    [now - TRASH_RETENTION_MS],
  );
  for (const c of expired) await purgeCustomer(db, c.id, c.name);
  return expired.length;
}

// ── Entries ─────────────────────────────────────────────────────────────────

/** Entries of a customer, newest first (cancelled ones included), each with its item lines. */
export async function listEntries(db: SQLiteDatabase, customerId: number): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT * FROM entries WHERE customer_id = ? ORDER BY created_at DESC, id DESC',
    [customerId],
  );
  const itemRows = await db.getAllAsync<EntryItemRow>(
    `SELECT i.* FROM entry_items i JOIN entries e ON e.id = i.entry_id WHERE e.customer_id = ? ORDER BY i.id`,
    [customerId],
  );
  const byEntry = new Map<number, EntryItem[]>();
  for (const r of itemRows) {
    const list = byEntry.get(r.entry_id) ?? [];
    list.push(toItem(r));
    byEntry.set(r.entry_id, list);
  }
  return rows.map((r) => ({ ...toEntry(r), items: byEntry.get(r.id) ?? [] }));
}

export interface NewEntry {
  customerId: number;
  kind: EntryKind;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  creditType?: CreditType | null;
  items?: EntryItem[];
  /** Logged as 'settle' instead of 'entry_add' (a payment that clears the whole balance). */
  settlesAll?: boolean;
}

/** Saves an entry and its item lines in one transaction, and logs it. */
export async function addEntry(db: SQLiteDatabase, input: NewEntry): Promise<number> {
  let entryId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO entries (customer_id, kind, amount, method, note, credit_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        input.customerId,
        input.kind,
        input.amount,
        input.method,
        input.note?.trim() || null,
        input.kind === 'credit' ? (input.creditType ?? null) : null,
        Date.now(),
      ],
    );
    entryId = result.lastInsertRowId;
    for (const item of input.items ?? []) {
      await db.runAsync(
        'INSERT INTO entry_items (entry_id, product_id, name, unit, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entryId, item.productId, item.name, item.unit, item.qty, item.unitPrice, item.total],
      );
    }
    const action: ActivityAction =
      input.kind === 'forgiven' ? 'forgive' : input.settlesAll ? 'settle' : 'entry_add';
    await logActivity(db, action, {
      customerId: input.customerId,
      entryId,
      amount: input.amount,
      details: input.kind,
    });
  });
  return entryId;
}

/** Cancels an entry: it stays in the history but no longer counts. */
export async function cancelEntry(db: SQLiteDatabase, entry: Entry, reason: string | null = null): Promise<void> {
  await db.runAsync('UPDATE entries SET cancelled_at = ?, cancel_reason = ? WHERE id = ?', [
    Date.now(),
    reason,
    entry.id,
  ]);
  await logActivity(db, 'entry_cancel', {
    customerId: entry.customerId,
    entryId: entry.id,
    amount: entry.amount,
    details: entry.kind,
  });
}

export async function restoreEntry(db: SQLiteDatabase, entry: Entry): Promise<void> {
  await db.runAsync('UPDATE entries SET cancelled_at = NULL, cancel_reason = NULL WHERE id = ?', [entry.id]);
  await logActivity(db, 'entry_restore', {
    customerId: entry.customerId,
    entryId: entry.id,
    amount: entry.amount,
    details: entry.kind,
  });
}

// ── Products ────────────────────────────────────────────────────────────────

/** Most-used products first, then alphabetical. */
export async function listProducts(db: SQLiteDatabase): Promise<Product[]> {
  const rows = await db.getAllAsync<ProductRow>(
    'SELECT id, name, price, unit, use_count FROM products ORDER BY use_count DESC, name COLLATE NOCASE',
  );
  return rows.map(toProduct);
}

export interface ProductInput {
  name: string;
  price: number;
  unit: ProductUnit;
}

export async function createProduct(db: SQLiteDatabase, input: ProductInput): Promise<number> {
  const result = await db.runAsync('INSERT INTO products (name, price, unit, created_at) VALUES (?, ?, ?, ?)', [
    input.name.trim(),
    input.price,
    input.unit,
    Date.now(),
  ]);
  return result.lastInsertRowId;
}

export async function updateProduct(db: SQLiteDatabase, id: number, input: ProductInput): Promise<void> {
  await db.runAsync('UPDATE products SET name = ?, price = ?, unit = ? WHERE id = ?', [
    input.name.trim(),
    input.price,
    input.unit,
    id,
  ]);
}

export async function deleteProduct(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

/** Counts how often a product is picked (once per entry), to show the most used first. */
export async function bumpProductUse(db: SQLiteDatabase, productIds: number[]): Promise<void> {
  for (const id of productIds) {
    await db.runAsync('UPDATE products SET use_count = use_count + 1 WHERE id = ?', [id]);
  }
}

// ── Home & reports (analysis 0002) ──────────────────────────────────────────

export interface RecentEntry extends Entry {
  customerName: string;
}

/** Latest entries across all active customers, newest first (cancelled ones included, marked). */
export async function listRecentEntries(db: SQLiteDatabase, limit = 20): Promise<RecentEntry[]> {
  const rows = await db.getAllAsync<EntryRow & { customer_name: string }>(
    `SELECT e.*, c.name AS customer_name FROM entries e JOIN customers c ON c.id = e.customer_id
     WHERE c.deleted_at IS NULL ORDER BY e.created_at DESC, e.id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({ ...toEntry(r), customerName: r.customer_name }));
}

export interface PeriodReport {
  creditGiven: number;
  collected: number;
  forgiven: number;
  /** All-time totals, for the collected-vs-outstanding ring. */
  totalCollected: number;
  outstanding: number;
}

/** Totals between `from` (inclusive) and `to` (exclusive), ignoring cancelled entries and trashed customers. */
export async function getPeriodReport(db: SQLiteDatabase, from: number, to: number): Promise<PeriodReport> {
  const period = await db.getFirstAsync<{ credit: number | null; paid: number | null; forgiven: number | null }>(
    `SELECT SUM(CASE WHEN e.kind = 'credit' THEN e.amount END) AS credit,
            SUM(CASE WHEN e.kind = 'payment' THEN e.amount END) AS paid,
            SUM(CASE WHEN e.kind = 'forgiven' THEN e.amount END) AS forgiven
     FROM entries e JOIN customers c ON c.id = e.customer_id
     WHERE e.cancelled_at IS NULL AND c.deleted_at IS NULL AND e.created_at >= ? AND e.created_at < ?`,
    [from, to],
  );
  const allTime = await db.getFirstAsync<{ paid: number | null }>(
    `SELECT SUM(e.amount) AS paid FROM entries e JOIN customers c ON c.id = e.customer_id
     WHERE e.kind = 'payment' AND e.cancelled_at IS NULL AND c.deleted_at IS NULL`,
  );
  const summary = await getSummary(db);
  return {
    creditGiven: period?.credit ?? 0,
    collected: period?.paid ?? 0,
    forgiven: period?.forgiven ?? 0,
    totalCollected: allTime?.paid ?? 0,
    outstanding: summary.totalOwed,
  };
}

export interface DebtAge {
  customerId: number;
  name: string;
  balance: number;
  /** Last payment (or forgiveness) time, or the first credit if he never paid. */
  sinceAt: number;
}

/** Customers who owe money, with the date the clock started (for 30 / 60 / 90-day buckets). */
export async function listDebtAges(db: SQLiteDatabase): Promise<DebtAge[]> {
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    balance: number;
    last_paid: number | null;
    first_credit: number | null;
  }>(
    `SELECT c.id, c.name,
       SUM(CASE WHEN e.kind = 'credit' THEN e.amount ELSE -e.amount END) AS balance,
       MAX(CASE WHEN e.kind IN ('payment', 'forgiven') THEN e.created_at END) AS last_paid,
       MIN(CASE WHEN e.kind = 'credit' THEN e.created_at END) AS first_credit
     FROM customers c JOIN entries e ON e.customer_id = c.id AND e.cancelled_at IS NULL
     WHERE c.archived = 0 AND c.deleted_at IS NULL
     GROUP BY c.id HAVING balance > 0 ORDER BY balance DESC`,
  );
  return rows.map((r) => ({
    customerId: r.id,
    name: r.name,
    balance: r.balance,
    sinceAt: r.last_paid ?? r.first_credit ?? Date.now(),
  }));
}

// ── Summary & settings ──────────────────────────────────────────────────────

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function getSummary(db: SQLiteDatabase): Promise<Summary> {
  const owed = await db.getFirstAsync<{ total: number | null; n: number }>(
    `SELECT SUM(balance) AS total, COUNT(*) AS n FROM (${CUSTOMER_SQL} ${ACTIVE} GROUP BY c.id) WHERE balance > 0`,
  );
  // Forgiven amounts are not money received, so they are not in "payments today".
  const today = await db.getFirstAsync<{ credit: number | null; payment: number | null }>(
    `SELECT SUM(CASE WHEN e.kind = 'credit' THEN e.amount END) AS credit,
            SUM(CASE WHEN e.kind = 'payment' THEN e.amount END) AS payment
     FROM entries e JOIN customers c ON c.id = e.customer_id
     WHERE e.created_at >= ? AND e.cancelled_at IS NULL AND c.deleted_at IS NULL`,
    [startOfToday()],
  );
  return {
    totalOwed: owed?.total ?? 0,
    customersInDebt: owed?.n ?? 0,
    creditToday: today?.credit ?? 0,
    paymentsToday: today?.payment ?? 0,
  };
}

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    value,
  ]);
}

// ── Backup ──────────────────────────────────────────────────────────────────

export interface BackupData {
  app: 'daftar';
  version: 1;
  exportedAt: string;
  customers: Customer[];
  entries: Entry[];
  /** Added in schema v2; optional so older backups still restore. */
  products?: Product[];
  /** Added in schema v3. */
  entryItems?: (EntryItem & { entryId: number })[];
  settings: Record<string, string>;
}

export async function exportAll(db: SQLiteDatabase): Promise<BackupData> {
  const customers = await db.getAllAsync<CustomerRow>(
    'SELECT id, name, phone, note, deleted_at, created_at, NULL AS balance, NULL AS last_activity_at FROM customers WHERE archived = 0',
  );
  const entries = await db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY created_at');
  const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return {
    app: 'daftar',
    version: 1,
    exportedAt: new Date().toISOString(),
    customers: customers.map(({ id, name, phone, note, deleted_at, created_at }) => ({
      id,
      name,
      phone,
      note,
      deletedAt: deleted_at,
      createdAt: created_at,
    })),
    entries: entries.map(toEntry),
    products: await listProducts(db),
    entryItems: (await db.getAllAsync<EntryItemRow>('SELECT * FROM entry_items ORDER BY id')).map((r) => ({
      entryId: r.entry_id,
      ...toItem(r),
    })),
    settings: Object.fromEntries(settingsRows.map((r) => [r.key, r.value])),
  };
}

/** Replaces all ledger data with the backup content (settings are merged). */
export async function importAll(db: SQLiteDatabase, data: BackupData): Promise<void> {
  if (data.app !== 'daftar' || data.version !== 1) throw new Error('Unsupported backup file');
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM entry_items');
    await db.runAsync('DELETE FROM entries');
    await db.runAsync('DELETE FROM customers');
    for (const c of data.customers) {
      await db.runAsync(
        'INSERT INTO customers (id, name, phone, note, deleted_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [c.id, c.name, c.phone, c.note ?? null, c.deletedAt ?? null, c.createdAt],
      );
    }
    for (const e of data.entries) {
      await db.runAsync(
        `INSERT INTO entries (id, customer_id, kind, amount, method, note, credit_type, cancelled_at, cancel_reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          e.customerId,
          e.kind,
          e.amount,
          e.method,
          e.note,
          e.creditType ?? null,
          e.cancelledAt ?? null,
          e.cancelReason ?? null,
          e.createdAt,
        ],
      );
    }
    for (const i of data.entryItems ?? []) {
      await db.runAsync(
        'INSERT INTO entry_items (entry_id, product_id, name, unit, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [i.entryId, i.productId, i.name, i.unit, i.qty, i.unitPrice, i.total],
      );
    }
    if (data.products) {
      await db.runAsync('DELETE FROM products');
      for (const p of data.products) {
        await db.runAsync(
          'INSERT INTO products (id, name, price, unit, use_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [p.id, p.name, p.price, p.unit ?? 'piece', p.useCount, Date.now()],
        );
      }
    }
    for (const [key, value] of Object.entries(data.settings)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value],
      );
    }
    await logActivity(db, 'backup_restore', { details: data.exportedAt });
  });
}
