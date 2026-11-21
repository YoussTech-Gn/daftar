import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered list of schema migrations. Never edit a shipped migration — append a new one.
 * The index + 1 is stored in PRAGMA user_version.
 */
const MIGRATIONS: string[] = [
  `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    created_at INTEGER NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('credit', 'payment')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL DEFAULT 'cash',
    note TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_entries_customer ON entries(customer_id, created_at);
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  // v2 — customer description + product catalog (decision 0008)
  `
  ALTER TABLE customers ADD COLUMN note TEXT;
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    use_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  `,
  // v3 — units, cash vs goods, items per entry (decision 0009)
  `
  ALTER TABLE products ADD COLUMN unit TEXT NOT NULL DEFAULT 'piece';
  ALTER TABLE entries ADD COLUMN credit_type TEXT;
  CREATE TABLE IF NOT EXISTS entry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    product_id INTEGER,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    qty REAL NOT NULL CHECK (qty > 0),
    unit_price INTEGER NOT NULL,
    total INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_entry_items_entry ON entry_items(entry_id);
  `,
  // v4 — trust core (decision 0013). Rebuilds `entries` to allow kind 'forgiven' (CHECK can't be altered)
  // and adds cancellation; customers get a trash; new activity log. Runs in a transaction (see below).
  `
  CREATE TABLE entries_v4 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('credit', 'payment', 'forgiven')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL DEFAULT 'cash',
    note TEXT,
    created_at INTEGER NOT NULL,
    credit_type TEXT,
    cancelled_at INTEGER,
    cancel_reason TEXT
  );
  INSERT INTO entries_v4 (id, customer_id, kind, amount, method, note, created_at, credit_type)
    SELECT id, customer_id, kind, amount, method, note, created_at, credit_type FROM entries;
  DROP TABLE entries;
  ALTER TABLE entries_v4 RENAME TO entries;
  CREATE INDEX IF NOT EXISTS idx_entries_customer ON entries(customer_id, created_at);
  ALTER TABLE customers ADD COLUMN deleted_at INTEGER;
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    action TEXT NOT NULL,
    customer_id INTEGER,
    entry_id INTEGER,
    amount INTEGER,
    details TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_activity_at ON activity_log(at);
  `,
];

/** From this version on, each migration runs in a transaction with foreign keys off (table rebuilds). */
const FIRST_TRANSACTIONAL = 4;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const next = version + 1;
    if (next < FIRST_TRANSACTIONAL) {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    } else {
      // SQLite's documented way to change a table: foreign keys off, rebuild in one transaction.
      await db.execAsync('PRAGMA foreign_keys = OFF;');
      try {
        await db.execAsync('BEGIN;');
        await db.execAsync(MIGRATIONS[version]);
        await db.execAsync(`PRAGMA user_version = ${next};`);
        await db.execAsync('COMMIT;');
      } catch (error) {
        await db.execAsync('ROLLBACK;').catch(() => undefined);
        throw error;
      } finally {
        await db.execAsync('PRAGMA foreign_keys = ON;');
      }
    }
    version = next;
  }
}
