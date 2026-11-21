import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArchiveRestore, ICON_SCALE, Info } from '@/components/icons';
import { AmountDisplay, Avatar, Card, DaftarButton, DaftarText, EmptyState, Row } from '@/components/ui';
import { listTrash, restoreCustomer, TRASH_RETENTION_MS } from '@/db/repository';
import type { CustomerWithBalance } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 13 · Trash: 30-day auto-delete info banner, deleted customers with days left & Restore CTA. */
export default function TrashScreen() {
  const db = useSQLiteContext();
  const { t } = useApp();
  const { colors } = useTheme();
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
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={customers}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={[styles.infoBanner, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
            <Row gap={10}>
              <Info size={ICON_SCALE.sm.size} color={colors.primary} strokeWidth={ICON_SCALE.sm.strokeWidth} />
              <DaftarText role="caption" tone="primary" weight="600" style={{ flex: 1 }}>
                {t('trashHint')}
              </DaftarText>
            </Row>
          </View>
        }
        ListEmptyComponent={<EmptyState variant="trash" title={t('trashEmpty')} hint={t('trashHint')} />}
        renderItem={({ item }) => {
          const left = Math.max(0, Math.ceil(((item.deletedAt ?? 0) + TRASH_RETENTION_MS - now) / DAY_MS));
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(item.id) } })}>
              <Card style={styles.rowCard}>
                <Row gap={12}>
                  <Avatar name={item.name} size={42} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <DaftarText role="heading" weight="600" numberOfLines={1}>
                      {item.name}
                    </DaftarText>
                    <Row gap={6}>
                      <AmountDisplay
                        amount={Math.abs(item.balance)}
                        size="caption"
                        color={item.balance > 0 ? colors.creditDeep : colors.textSecondary}
                      />
                      <DaftarText role="caption" tone="muted">
                        · {t('daysLeft', { n: left })}
                      </DaftarText>
                    </Row>
                  </View>
                  <DaftarButton
                    label={t('restore')}
                    icon={ArchiveRestore}
                    variant="secondary"
                    onPress={async () => {
                      await restoreCustomer(db, item.id);
                      haptic.success();
                      load();
                    }}
                  />
                </Row>
              </Card>
            </Pressable>
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
  infoBanner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  rowCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
