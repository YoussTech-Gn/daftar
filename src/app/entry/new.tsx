import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Button, Chip, Field, Txt } from '@/components/ui';
import { addEntry } from '@/db/repository';
import { getCurrency, parseAmount } from '@/domain/currency';
import { PAYMENT_METHODS, type EntryKind, type PaymentMethod } from '@/domain/types';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

export default function NewEntryScreen() {
  const db = useSQLiteContext();
  const { t, settings } = useApp();
  const palette = usePalette();
  const params = useLocalSearchParams<{ customerId: string; kind: EntryKind }>();
  const kind: EntryKind = params.kind === 'payment' ? 'payment' : 'credit';
  const color = kind === 'credit' ? palette.credit : palette.payment;
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const minor = parseAmount(amount, settings.currency);
    if (minor === null) {
      setError(t('invalidAmount'));
      return;
    }
    setSaving(true);
    try {
      await addEntry(db, {
        customerId: Number(params.customerId),
        kind,
        amount: minor,
        method: kind === 'payment' ? method : 'cash',
        note,
      });
      router.back();
    } catch {
      setError(t('error'));
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: kind === 'credit' ? t('gaveCredit') : t('receivedPayment') }} />
      <View style={{ gap: 6 }}>
        <Txt size={14} muted weight="600">
          {t('amount')} ({getCurrency(settings.currency).symbol})
        </Txt>
        <TextInput
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setError(null);
          }}
          keyboardType="decimal-pad"
          autoFocus
          placeholder="0"
          placeholderTextColor={palette.muted}
          style={{
            fontSize: 44,
            fontWeight: '800',
            color,
            textAlign: 'center',
            borderBottomWidth: 2,
            borderColor: color,
            paddingVertical: 8,
          }}
        />
      </View>
      {kind === 'payment' ? (
        <View style={{ gap: 10 }}>
          <Txt size={14} muted weight="600">
            {t('method')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PAYMENT_METHODS.map((m) => (
              <Chip key={m} label={t(`method_${m}`)} selected={method === m} onPress={() => setMethod(m)} />
            ))}
          </View>
        </View>
      ) : null}
      <Field label={t('note')} placeholder={t('notePlaceholder')} value={note} onChangeText={setNote} />
      {error ? <Txt style={{ color: palette.danger }}>{error}</Txt> : null}
      <Button label={t('save')} variant={kind} onPress={save} loading={saving} />
    </ScrollView>
  );
}
