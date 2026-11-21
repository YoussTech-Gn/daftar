import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Customer,
  CustomerWithBalance,
  Entry,
  EntryKind,
  PaymentMethod,
  Product,
  Summary,
} from '@/domain/types';

interface CustomerRow {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
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
  created_at: number;
}

interface ProductRow {
  id: number;
  name: string;
  price: number;
  use_count: number;
}

const BALANCE_SQL = `
  SELECT c.id, c.name, c.phone, c.note, c.created_at,
    COALESCE(SUM(CASE WHEN e.kind = 'credit' THEN e.amount ELSE -e.amount END), 0) AS balance,
    MAX(e.created_at) AS last_activity_at
  FROM customers c
  LEFT JOIN entries e ON e.customer_id = c.id
  WHERE c.archived = 0`;

function toCustomer(row: CustomerRow): CustomerWithBalance {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    note: row.note,
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
    createdAt: row.created_at,
  };
}

function toProduct(row: ProductRow): Product {
  return { id: row.id, name: row.name, price: row.price, useCount: row.use_count };
}

export async function listCustomers(db: SQLiteDatabase, search = ''): Promise<CustomerWithBalance[]> {
  const term = search.trim();
  const order = 'GROUP BY c.id ORDER BY balance DESC, last_activity_at DESC, c.name';
  const rows = term
    ? await db.getAllAsync<CustomerRow>(
        `${BALANCE_SQL} AND (c.name LIKE ? OR c.phone LIKE ? OR c.note LIKE ?) ${order}`,
        [`%${term}%`, `%${term}%`, `%${term}%`],
      )
    : await db.getAllAsync<CustomerRow>(`${BALANCE_SQL} ${order}`);
  return rows.map(toCustomer);
}

export async function getCustomer(db: SQLiteDatabase, id: number): Promise<CustomerWithBalance | null> {
  const row = await db.getFirstAsync<CustomerRow>(`${BALANCE_SQL} AND c.id = ? GROUP BY c.id`, [id]);
  return row ? toCustomer(row) : null;
}

export async function countCustomers(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM customers WHERE archived = 0');
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
  return result.lastInsertRowId;
}

export async function updateCustomer(db: SQLiteDatabase, id: number, input: CustomerInput): Promise<void> {
  await db.runAsync('UPDATE customers SET name = ?, phone = ?, note = ? WHERE id = ?', [
    input.name.trim(),
    input.phone?.trim() || null,
    input.note?.trim() || null,
    id,
  ]);
}

export async function deleteCustomer(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM entries WHERE customer_id = ?', [id]);
    await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
  });
}

export async function listEntries(db: SQLiteDatabase, customerId: number): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT * FROM entries WHERE customer_id = ? ORDER BY created_at DESC, id DESC',
    [customerId],
  );
  return rows.map(toEntry);
}

export async function addEntry(
  db: SQLiteDatabase,
  input: { customerId: number; kind: EntryKind; amount: number; method: PaymentMethod; note: string | null },
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO entries (customer_id, kind, amount, method, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [input.customerId, input.kind, input.amount, input.method, input.note?.trim() || null, Date.now()],
  );
  return result.lastInsertRowId;
}

export async function deleteEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

// ── Products ────────────────────────────────────────────────────────────────

/** Most-used products first, then alphabetical. */
export async function listProducts(db: SQLiteDatabase): Promise<Product[]> {
  const rows = await db.getAllAsync<ProductRow>(
    'SELECT id, name, price, use_count FROM products ORDER BY use_count DESC, name COLLATE NOCASE',
  );
  return rows.map(toProduct);
}

export async function createProduct(db: SQLiteDatabase, name: string, price: number): Promise<number> {
  const result = await db.runAsync('INSERT INTO products (name, price, created_at) VALUES (?, ?, ?)', [
    name.trim(),
    price,
    Date.now(),
  ]);
  return result.lastInsertRowId;
}

export async function updateProduct(db: SQLiteDatabase, id: number, name: string, price: number): Promise<void> {
  await db.runAsync('UPDATE products SET name = ?, price = ? WHERE id = ?', [name.trim(), price, id]);
}

export async function deleteProduct(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

export async function bumpProductUse(db: SQLiteDatabase, uses: { id: number; qty: number }[]): Promise<void> {
  for (const u of uses) {
    await db.runAsync('UPDATE products SET use_count = use_count + ? WHERE id = ?', [u.qty, u.id]);
  }
}

// ── Summary & settings ──────────────────────────────────────────────────────

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function getSummary(db: SQLiteDatabase): Promise<Summary> {
  const owed = await db.getFirstAsync<{ total: number | null; n: number }>(
    `SELECT SUM(balance) AS total, COUNT(*) AS n FROM (${BALANCE_SQL} GROUP BY c.id) WHERE balance > 0`,
  );
  const today = await db.getFirstAsync<{ credit: number | null; payment: number | null }>(
    `SELECT SUM(CASE WHEN kind = 'credit' THEN amount END) AS credit,
            SUM(CASE WHEN kind = 'payment' THEN amount END) AS payment
     FROM entries WHERE created_at >= ?`,
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
  settings: Record<string, string>;
}

export async function exportAll(db: SQLiteDatabase): Promise<BackupData> {
  const customers = await db.getAllAsync<CustomerRow>(
    'SELECT id, name, phone, note, created_at, NULL AS balance, NULL AS last_activity_at FROM customers WHERE archived = 0',
  );
  const entries = await db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY created_at');
  const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return {
    app: 'daftar',
    version: 1,
    exportedAt: new Date().toISOString(),
    customers: customers.map(({ id, name, phone, note, created_at }) => ({
      id,
      name,
      phone,
      note,
      createdAt: created_at,
    })),
    entries: entries.map(toEntry),
    products: await listProducts(db),
    settings: Object.fromEntries(settingsRows.map((r) => [r.key, r.value])),
  };
}

/** Replaces all ledger data with the backup content (settings are merged). */
export async function importAll(db: SQLiteDatabase, data: BackupData): Promise<void> {
  if (data.app !== 'daftar' || data.version !== 1) throw new Error('Unsupported backup file');
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM entries');
    await db.runAsync('DELETE FROM customers');
    for (const c of data.customers) {
      await db.runAsync('INSERT INTO customers (id, name, phone, note, created_at) VALUES (?, ?, ?, ?, ?)', [
        c.id,
        c.name,
        c.phone,
        c.note ?? null,
        c.createdAt,
      ]);
    }
    for (const e of data.entries) {
      await db.runAsync(
        'INSERT INTO entries (id, customer_id, kind, amount, method, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [e.id, e.customerId, e.kind, e.amount, e.method, e.note, e.createdAt],
      );
    }
    if (data.products) {
      await db.runAsync('DELETE FROM products');
      for (const p of data.products) {
        await db.runAsync('INSERT INTO products (id, name, price, use_count, created_at) VALUES (?, ?, ?, ?, ?)', [
          p.id,
          p.name,
          p.price,
          p.useCount,
          Date.now(),
        ]);
      }
    }
    for (const [key, value] of Object.entries(data.settings)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value],
      );
    }
  });
}
