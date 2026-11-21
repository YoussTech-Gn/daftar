import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArchiveRestore,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  CheckCheck,
  HardDriveUpload,
  HeartHandshake,
  History,
  ICON_SCALE,
  Pencil,
  RotateCcw,
  Trash2,
  UserPlus,
  type LucideIcon,
} from '@/components/icons';
import { AmountDisplay, Card, DaftarText, EmptyState, Row } from '@/components/ui';
import { listActivity } from '@/db/repository';
import type { ActivityAction, ActivityEntry } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { useTheme, type ColorTokens } from '@/theme';

const ICONS: Record<ActivityAction, LucideIcon> = {
  entry_add: ArrowUpRight,
  entry_cancel: Ban,
  entry_restore: RotateCcw,
  settle: CheckCheck,
  forgive: HeartHandshake,
  customer_add: UserPlus,
  customer_edit: Pencil,
  customer_trash: Trash2,
  customer_restore: ArchiveRestore,
  customer_purge: Trash2,
  backup_restore: HardDriveUpload,
};

function activityPalette(item: ActivityEntry, colors: ColorTokens): { Icon: LucideIcon; bg: string; fg: string } {
  if (item.action === 'entry_add') {
    if (item.details === 'payment') {
      return { Icon: ArrowDownLeft, bg: colors.paymentSoft, fg: colors.paymentDeep };
    }
    return { Icon: ArrowUpRight, bg: colors.creditSoft, fg: colors.creditDeep };
  }
  if (item.action === 'settle') {
    return { Icon: CheckCheck, bg: colors.paymentSoft, fg: colors.paymentDeep };
  }
  if (item.action === 'forgive') {
    return { Icon: HeartHandshake, bg: colors.forgivenSoft, fg: colors.forgiven };
  }
  if (item.action === 'entry_cancel') {
    return { Icon: Ban, bg: colors.cancelledSoft, fg: colors.cancelled };
  }
  if (item.action === 'customer_trash' || item.action === 'customer_purge') {
    return { Icon: Trash2, bg: colors.dangerSoft, fg: colors.danger };
  }
  return { Icon: ICONS[item.action] ?? History, bg: colors.primarySoft, fg: colors.primary };
}

/** 12 · Activity Log: chronological read-only audit trail. */
export default function ActivityScreen() {
  const db = useSQLiteContext();
  const { t, settings } = useApp();
  const { colors } = useTheme();
  const [items, setItems] = useState<ActivityEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      listActivity(db).then(setItems);
    }, [db]),
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState variant="activity" title={t('activityEmpty')} />}
        renderItem={({ item }) => {
          const look = activityPalette(item, colors);
          const who = item.customerName ?? (item.action === 'customer_purge' ? item.details : null);
          return (
            <Card style={styles.rowCard}>
              <Row gap={12}>
                <View style={[styles.iconBox, { backgroundColor: look.bg }]}>
                  <look.Icon size={ICON_SCALE.sm.size} color={look.fg} strokeWidth={ICON_SCALE.sm.strokeWidth} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <DaftarText role="body" weight="600" numberOfLines={2}>
                    {t(`act_${item.action}`)}
                    {who ? ` · ${who}` : ''}
                  </DaftarText>
                  <DaftarText role="caption" tone="muted" numberOfLines={1}>
                    {new Date(item.at).toLocaleString(settings.language)}
                  </DaftarText>
                </View>
                {item.amount != null ? (
                  <AmountDisplay amount={item.amount} size="label" color={look.fg} />
                ) : null}
              </Row>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  rowCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
