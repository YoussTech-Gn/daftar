import { buildSmsLink, buildWhatsAppLink, stripDirectionMarks } from '@/domain/reminder';
import type { EntryKind } from '@/domain/types';
import type { TranslationKey } from '@/i18n/translations';

export interface ReceiptInput {
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  money: (minor: number) => string;
  shopName: string;
  countryCode: string;
  customer: { name: string; phone: string | null };
  kind: EntryKind;
  amount: number;
  items: string;
  newBalance: number;
}

export interface ReceiptPayload {
  customerName: string;
  phone: string;
  text: string;
  whatsappUrl: string;
  smsUrl: string;
}

/** Builds plain-text WhatsApp & SMS receipt URLs after saving an entry, or null if customer has no phone. */
export function buildReceiptPayload(input: ReceiptInput): ReceiptPayload | null {
  const { t, money, customer } = input;
  if (!customer.phone) return null;

  const shop = input.shopName || t('appName');
  const amount = money(input.amount);
  const message =
    input.kind === 'forgiven'
      ? t('receiptForgivenTemplate', { shop, amount })
      : input.kind === 'payment' && input.newBalance === 0
        ? t('receiptSettledTemplate', { shop, amount })
        : t('receiptTemplate', {
            shop,
            entry: input.kind === 'credit' ? t('receiptCredit') : t('receiptPayment'),
            amount,
            items: input.items ? ` (${input.items})` : '',
            balance: money(input.newBalance),
          });

  // Plain text for messages: invisible direction marks would make an SMS use costly Unicode encoding.
  const text = stripDirectionMarks(message);
  return {
    customerName: customer.name,
    phone: customer.phone,
    text,
    whatsappUrl: buildWhatsAppLink(customer.phone, text, input.countryCode),
    smsUrl: buildSmsLink(customer.phone, text, input.countryCode),
  };
}
