import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArchiveRestore, ICON, Trash2 } from '@/components/icons';
import { Avatar, Card, Row, Txt } from '@/components/ui';
import { listTrash, restoreCustomer, TRASH_RETENTION_MS } from '@/db/repository';
import type { CustomerWithBalance } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Customers moved to the trash; restorable until they are purged after 30 days. */
export default function TrashScreen() {
  const db = useSQLiteContext();
  const { t, money } = useApp();
  const palette = usePalette();
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    setCustomers(await listTrash(db));
    setNow(Date.now());
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <FlatList
        data={customers}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <Txt muted size={14} style={{ marginBottom: 4 }}>
            {t('trashHint')}
          </Txt>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 48 }}>
            <Trash2 size={ICON.xl} color={palette.muted} strokeWidth={1.5} />
            <Txt muted style={{ textAlign: 'center' }}>
              {t('trashEmpty')}
            </Txt>
          </View>
        }
        renderItem={({ item }) => {
          const left = Math.max(0, Math.ceil(((item.deletedAt ?? 0) + TRASH_RETENTION_MS - now) / DAY_MS));
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(item.id) } })}>
              <Card style={{ paddingVertical: 12 }}>
                <Row gap={12}>
                  <Avatar name={item.name} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt weight="700" numberOfLines={1}>
                      {item.name}
                    </Txt>
                    <Txt size={13} muted>
                      {money(item.balance)} · {t('daysLeft', { n: left })}
                    </Txt>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('restore')}
                    hitSlop={10}
                    onPress={async () => {
                      await restoreCustomer(db, item.id);
                      load();
                    }}>
                    <Row gap={6}>
                      <ArchiveRestore size={ICON.md} color={palette.primary} />
                      <Txt weight="700" style={{ color: palette.primary }}>
                        {t('restore')}
                      </Txt>
                    </Row>
                  </Pressable>
                </Row>
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
