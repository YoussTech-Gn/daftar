import { Pressable, View } from 'react-native';

import {
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  BookOpen,
  Eye,
  EyeOff,
  HeartHandshake,
  ICON_SCALE,
  type LucideIcon,
} from '@/components/icons';
import { AmountDisplay } from '@/components/ui';
import type { RecentEntry } from '@/db/repository';
import { dayGroup } from '@/domain/report';
import { haptic } from '@/lib/haptics';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme, v4 } from '@/theme';
import { Txt } from './primitives';

/** Privacy eye: masks every amount in Accueil, Clients and Rapports at once (session store). */
export function PrivacyEye() {
  const { t } = useApp();
  const { scheme } = useTheme();
  const hidden = useSessionStore((s) => s.amountsHidden);
  const toggle = useSessionStore((s) => s.toggleAmountsHidden);
  const Icon = hidden ? EyeOff : Eye;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: hidden }}
      accessibilityLabel={hidden ? t('showAmounts') : t('hideAmounts')}
      hitSlop={6}
      onPress={() => {
        haptic.selection();
        toggle();
      }}
      className={`h-12 w-12 items-center justify-center rounded-full border border-line ${hidden ? 'bg-accent-soft' : 'bg-surface-muted'}`}>
      <Icon size={ICON_SCALE.sm.size} color={v4(scheme, hidden ? 'accent' : 'text-secondary')} />
    </Pressable>
  );
}

/** "14:05" today / yesterday, "21 nov." before. */
export function entryTime(ts: number, lang: string, t: (k: 'yesterday') => string, now = Date.now()): string {
  const d = new Date(ts);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const group = dayGroup(ts, now);
  if (group === 'today') return hm;
  if (group === 'yesterday') return `${t('yesterday')} · ${hm}`;
  return d.toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
}

const SOFT_BG = {
  credit: 'bg-credit-soft',
  payment: 'bg-payment-soft',
  plum: 'bg-plum-soft',
  'text-muted': 'bg-surface-muted',
} as const;

/** One row of the unified activity panel. Cancelled entries: muted and struck through. */
export function ActivityRow({ entry, onPress, last }: { entry: RecentEntry; onPress: () => void; last: boolean }) {
  const { t, settings, isRTL } = useApp();
  const { colors, scheme } = useTheme();
  const cancelled = entry.cancelledAt !== null;

  let Icon: LucideIcon = ArrowUpRight;
  let tone: 'credit' | 'payment' | 'plum' | 'text-muted' = 'credit';
  let sign: '+' | '−' = '+';
  let label = entry.creditType === 'goods' ? t('creditGoods') : t('creditEntry');
  if (entry.kind === 'payment') {
    Icon = ArrowDownLeft;
    tone = 'payment';
    sign = '−';
    label = `${t('paymentEntry')} · ${t(`method_${entry.method}`)}`;
  } else if (entry.kind === 'forgiven') {
    Icon = HeartHandshake;
    tone = 'plum';
    sign = '−';
    label = t('forgiven');
  } else if (entry.creditType === 'opening') {
    Icon = BookOpen;
    label = t('openingBalanceEntry');
  }
  if (cancelled) {
    Icon = Ban;
    tone = 'text-muted';
    label = t('cancelled');
  }
  const amountColor = cancelled
    ? colors.cancelled
    : tone === 'credit'
      ? colors.creditDeep
      : tone === 'payment'
        ? colors.paymentDeep
        : colors.forgiven;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-[64px] items-center gap-3 px-4 py-3 active:bg-surface-muted ${last ? '' : 'border-b border-line'} ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${SOFT_BG[tone]}`}>
        <Icon size={ICON_SCALE.sm.size} color={v4(scheme, tone)} />
      </View>
      <View className="flex-1 gap-0.5">
        <Txt
          weight="600"
          numberOfLines={1}
          className={cancelled ? 'text-ink-3 line-through' : 'text-ink'}
          style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {entry.customerName}
        </Txt>
        <Txt numberOfLines={1} className="text-xs text-ink-3" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {label} · {entryTime(entry.createdAt, settings.language, t)}
        </Txt>
      </View>
      <AmountDisplay amount={entry.amount} sign={sign} size="label" color={amountColor} strikeThrough={cancelled} />
    </Pressable>
  );
}
