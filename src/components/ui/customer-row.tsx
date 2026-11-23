import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ICON_SCALE, Plus, Search, X } from '@/components/icons';
import { daysAgo } from '@/domain/time';
import type { CustomerWithBalance } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { getFontFamily, usePressScale, useTheme } from '@/theme';
import { AmountDisplay } from './amount-display';
import { Avatar, DaftarText, Row } from './text';

function QuickCreditPill({ customerId }: { customerId: number }) {
  const { colors } = useTheme();
  const { t, isRTL } = useApp();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.95,
    opacityTo: 0.9,
    haptic: 'light',
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newCredit')}
        hitSlop={8}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() =>
          router.push({
            pathname: '/entry/new',
            params: { customerId: String(customerId), kind: 'credit' },
          })
        }
        style={[
          styles.quickPill,
          {
            backgroundColor: colors.creditSoft,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}>
        <Plus size={ICON_SCALE.xs.size} color={colors.creditDeep} strokeWidth={2.4} />
        <DaftarText role="caption" tone="creditDeep" weight="700" numberOfLines={1}>
          {t('quickCredit')}
        </DaftarText>
      </Pressable>
    </Animated.View>
  );
}

/** One customer row: initials avatar, name, description · phone, last activity, balance, optional + Credit. */
export function CustomerRow({
  customer,
  onPress,
  showQuickCredit = true,
}: {
  customer: CustomerWithBalance;
  onPress?: () => void;
  showQuickCredit?: boolean;
}) {
  const { colors, shadows } = useTheme();
  const { t, isRTL } = useApp();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.98,
    opacityTo: 0.94,
    haptic: 'selection',
  });

  const owes = customer.balance > 0;
  const advance = customer.balance < 0;
  const days = customer.lastActivityAt === null ? null : daysAgo(customer.lastActivityAt);
  const activity =
    days === null
      ? t('noActivity')
      : days === 0
        ? t('lastToday')
        : days === 1
          ? t('lastYesterday')
          : t('lastDaysAgo', { n: days });
  const details = [customer.note, customer.phone].filter(Boolean).join(' · ');

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={
          onPress ?? (() => router.push({ pathname: '/customer/[id]', params: { id: String(customer.id) } }))
        }
        style={[
          styles.card,
          shadows.card,
          { backgroundColor: colors.surface },
        ]}>
        <Row gap={12}>
          <Avatar name={customer.name} id={customer.id} size={42} />

          <View style={styles.centerCol}>
            <DaftarText role="heading" weight="600" numberOfLines={1}>
              {customer.name}
            </DaftarText>
            {details ? (
              <DaftarText role="caption" tone="secondary" numberOfLines={1}>
                {details}
              </DaftarText>
            ) : null}
            <DaftarText role="caption" tone="muted" numberOfLines={1}>
              {activity}
            </DaftarText>
          </View>

          <View style={[styles.endCol, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
            {owes ? (
              <AmountDisplay amount={customer.balance} size="label" color={colors.creditDeep} />
            ) : advance ? (
              <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                <AmountDisplay amount={Math.abs(customer.balance)} size="label" color={colors.paymentDeep} />
                <DaftarText role="caption" tone="paymentDeep" weight="600">
                  {t('advance')}
                </DaftarText>
              </View>
            ) : (
              <View style={[styles.settledPill, { backgroundColor: colors.paymentSoft }]}>
                <DaftarText role="caption" tone="paymentDeep" weight="600">
                  {t('settled')}
                </DaftarText>
              </View>
            )}

            {showQuickCredit ? <QuickCreditPill customerId={customer.id} /> : null}
          </View>
        </Row>
      </Pressable>
    </Animated.View>
  );
}

/** Sunken search track with Indigo focus border and clear button. */
export function SearchBox({
  value,
  onChangeText,
  autoFocus,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const { t, isRTL, settings } = useApp();
  const [focused, setFocused] = useState(false);

  return (
    <Row
      gap={10}
      style={[
        styles.search,
        {
          backgroundColor: colors.surfaceSunken,
          borderColor: focused ? colors.focus : colors.border,
        },
      ]}>
      <Search size={ICON_SCALE.sm.size} color={focused ? colors.primary : colors.textMuted} strokeWidth={ICON_SCALE.sm.strokeWidth} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? t('searchCustomers')}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.searchInput,
          {
            color: colors.text,
            fontFamily: getFontFamily(settings.language, '400'),
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('clear')}
          hitSlop={10}
          onPress={() => onChangeText('')}>
          <X size={ICON_SCALE.sm.size} color={colors.textMuted} strokeWidth={ICON_SCALE.sm.strokeWidth} />
        </Pressable>
      ) : null}
    </Row>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 68,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  centerCol: {
    flex: 1,
    gap: 2,
  },
  endCol: {
    gap: 6,
    flexShrink: 0,
  },
  quickPill: {
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  settledPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  search: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 6,
  },
});
