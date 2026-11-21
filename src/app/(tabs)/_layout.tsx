import { router, Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChartPie, Ellipsis, House, ICON, Plus, Users } from '@/components/icons';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** Centre button: opens "New credit" (customer picker first). It is not a real tab. */
function NewCreditButton() {
  const { t } = useApp();
  const palette = usePalette();
  return (
    <View style={styles.centerSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newCredit')}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          router.push({ pathname: '/pick-customer', params: { kind: 'credit' } });
        }}
        style={({ pressed }) => [
          styles.centerButton,
          { backgroundColor: palette.primary, borderColor: palette.background, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Plus size={30} color={palette.primaryText} strokeWidth={2.75} />
      </Pressable>
    </View>
  );
}

/** Bottom tabs (analysis 0002): Home · Customers · [+] · Reports · More. */
export default function TabsLayout() {
  const { t, settings } = useApp();
  const palette = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: palette.background },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.card, borderTopColor: palette.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: settings.shopName || t('appName'),
          tabBarLabel: t('tabHome'),
          tabBarIcon: ({ color }) => <House size={ICON.lg} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('tabCustomers'),
          tabBarIcon: ({ color }) => <Users size={ICON.lg} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{ title: t('newCredit'), tabBarButton: () => <NewCreditButton /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tabReports'),
          tabBarIcon: ({ color }) => <ChartPie size={ICON.lg} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabMore'),
          tabBarIcon: ({ color }) => <Ellipsis size={ICON.lg} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerSlot: { flex: 1, alignItems: 'center' },
  centerButton: {
    marginTop: -22,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
