import { Alert, Linking } from 'react-native';

import { buildWhatsAppLink } from '@/domain/reminder';
import type { EntryKind } from '@/domain/types';
import type { TranslationKey } from '@/i18n/translations';

interface ReceiptInput {
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

/** After an entry is saved, offers to send the customer a WhatsApp receipt with the new balance. */
export function offerReceipt(input: ReceiptInput, onDone: () => void): void {
  const { t, money, customer } = input;
  if (!customer.phone) {
    onDone();
    return;
  }
  const message = t('receiptTemplate', {
    shop: input.shopName || t('appName'),
    entry: input.kind === 'credit' ? t('receiptCredit') : t('receiptPayment'),
    amount: money(input.amount),
    items: input.items ? ` (${input.items})` : '',
    balance: money(input.newBalance),
  });
  const phone = customer.phone;
  Alert.alert(t('sendReceiptTitle'), t('sendReceiptBody', { name: customer.name }), [
    { text: t('notNow'), style: 'cancel', onPress: onDone },
    {
      text: t('send'),
      onPress: () => {
        Linking.openURL(buildWhatsAppLink(phone, message, input.countryCode)).catch(() => undefined);
        onDone();
      },
    },
  ], { cancelable: true, onDismiss: onDone });
}
