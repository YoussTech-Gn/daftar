import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Ban,
  CheckCheck,
  HandHeart,
  HardDriveUpload,
  History,
  ICON,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  type LucideIcon,
} from '@/components/icons';
import { Card, Row, Txt } from '@/components/ui';
import { listActivity } from '@/db/repository';
import type { ActivityAction, ActivityEntry } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

const ICONS: Record<ActivityAction, LucideIcon> = {
  entry_add: ArrowUp,
  entry_cancel: Ban,
  entry_restore: Undo2,
  settle: CheckCheck,
  forgive: HandHeart,
  customer_add: Plus,
  customer_edit: Pencil,
  customer_trash: Trash2,
  customer_restore: ArchiveRestore,
  customer_purge: Trash2,
  backup_restore: HardDriveUpload,
};

/** Read-only log of every change (decision 0013). */
export default function ActivityScreen() {
  const db = useSQLiteContext();
  const { t, money, settings } = useApp();
  const palette = usePalette();
  const [items, setItems] = useState<ActivityEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      listActivity(db).then(setItems);
    }, [db]),
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 48 }}>
            <History size={ICON.xl} color={palette.muted} strokeWidth={1.5} />
            <Txt muted style={{ textAlign: 'center' }}>
              {t('activityEmpty')}
            </Txt>
          </View>
        }
        renderItem={({ item }) => {
          const Icon =
            item.action === 'entry_add' && item.details === 'payment' ? ArrowDown : ICONS[item.action] ?? History;
          const who = item.customerName ?? (item.action === 'customer_purge' ? item.details : null);
          return (
            <Card style={{ paddingVertical: 10 }}>
              <Row gap={12}>
                <Icon size={ICON.md} color={palette.primary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="600">
                    {t(`act_${item.action}`)}
                    {who ? ` · ${who}` : ''}
                  </Txt>
                  <Txt size={12} muted>
                    {new Date(item.at).toLocaleString(settings.language)}
                  </Txt>
                </View>
                {item.amount != null ? <Txt weight="700">{money(item.amount)}</Txt> : null}
              </Row>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}
