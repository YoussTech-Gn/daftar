export type EntryKind = 'credit' | 'payment';

export type PaymentMethod = 'cash' | 'wave' | 'orange_money' | 'mtn_momo' | 'other';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'wave', 'orange_money', 'mtn_momo', 'other'];

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  createdAt: number;
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
  createdAt: number;
}

export interface Summary {
  totalOwed: number;
  customersInDebt: number;
  creditToday: number;
  paymentsToday: number;
}
