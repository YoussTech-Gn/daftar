import { Alert, Linking } from 'react-native';

import { buildSmsLink, buildWhatsAppLink, stripDirectionMarks } from '@/domain/reminder';
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
  const phone = customer.phone;
  // Plain text for messages: invisible direction marks would make an SMS use the costly Unicode encoding.
  const text = stripDirectionMarks(message);
  const open = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
    onDone();
  };
  Alert.alert(
    t('sendReceiptTitle'),
    t('sendReceiptBody', { name: customer.name }),
    [
      { text: t('notNow'), style: 'cancel', onPress: onDone },
      // Many customers have basic phones without WhatsApp (analysis 0002).
      { text: t('sendSms'), onPress: () => open(buildSmsLink(phone, text, input.countryCode)) },
      { text: t('sendWhatsApp'), onPress: () => open(buildWhatsAppLink(phone, text, input.countryCode)) },
    ],
    { cancelable: true, onDismiss: onDone },
  );
}
