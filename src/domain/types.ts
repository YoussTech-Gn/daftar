export type EntryKind = 'credit' | 'payment';

export type PaymentMethod = 'cash' | 'wave' | 'orange_money' | 'mtn_momo' | 'other';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'wave', 'orange_money', 'mtn_momo', 'other'];

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  /** Free description to recognise the customer, e.g. "tailor, street 10". */
  note?: string | null;
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
  createdAt: number;
}

export interface Summary {
  totalOwed: number;
  customersInDebt: number;
  creditToday: number;
  paymentsToday: number;
}
