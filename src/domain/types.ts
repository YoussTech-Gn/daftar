/** credit raises the balance; payment and forgiven lower it (forgiven is not money received). */
export type EntryKind = 'credit' | 'payment' | 'forgiven';

/** Sign of an entry on the customer's balance. */
export function balanceSign(kind: EntryKind): 1 | -1 {
  return kind === 'credit' ? 1 : -1;
}

export type ActivityAction =
  | 'entry_add'
  | 'entry_cancel'
  | 'entry_restore'
  | 'settle'
  | 'forgive'
  | 'customer_add'
  | 'customer_edit'
  | 'customer_trash'
  | 'customer_restore'
  | 'customer_purge'
  | 'backup_restore';

export interface ActivityEntry {
  id: number;
  at: number;
  action: ActivityAction;
  customerId: number | null;
  customerName: string | null;
  entryId: number | null;
  amount: number | null;
  details: string | null;
}

export type PaymentMethod = 'cash' | 'wave' | 'orange_money' | 'mtn_momo' | 'other';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'wave', 'orange_money', 'mtn_momo', 'other'];

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  /** Free description to recognise the customer, e.g. "tailor, street 10". */
  note?: string | null;
  /** Set when the customer is in the trash (schema v4). */
  deletedAt?: number | null;
  createdAt: number;
}

/** How a product is sold. Kg and liter allow fractions (½ kg). */
export type ProductUnit = 'piece' | 'kg' | 'liter' | 'pack';

export const PRODUCT_UNITS: ProductUnit[] = ['piece', 'kg', 'liter', 'pack'];

export function isFractionalUnit(unit: ProductUnit): boolean {
  return unit === 'kg' || unit === 'liter';
}

export interface Product {
  id: number;
  name: string;
  /** Price in minor units, for one unit (1 kg, 1 piece…). */
  price: number;
  unit: ProductUnit;
  useCount: number;
}

/** Cash loan (money only) or goods taken from the shop. */
export type CreditType = 'cash' | 'goods';

/** One line of an entry. Name and price are copied at sale time so history never changes. */
export interface EntryItem {
  productId: number | null;
  name: string;
  unit: ProductUnit;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface CustomerWithBalance extends Customer {
  /** Amount the customer owes the shop, in minor units. Negative = shop owes the customer. */
  balance: number;
  lastActivityAt: number | null;
}

export interface Entry {
  id: number;
  customerId: number;
  kind: EntryKind;
  /** Always positive, in minor units of the shop currency. */
  amount: number;
  method: PaymentMethod;
  note: string | null;
  /** Only for credits recorded since schema v3. */
  creditType?: CreditType | null;
  items?: EntryItem[];
  /** Set when the entry was cancelled (schema v4). Cancelled entries stay visible but don't count. */
  cancelledAt?: number | null;
  cancelReason?: string | null;
  createdAt: number;
}

export interface Summary {
  totalOwed: number;
  customersInDebt: number;
  creditToday: number;
  paymentsToday: number;
}
