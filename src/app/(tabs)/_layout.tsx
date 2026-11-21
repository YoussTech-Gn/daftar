import { Tabs } from 'expo-router';

import { BottomTabBar } from '@/components/ui';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** Bottom tabs: Home · Customers · [+] · Reports · More. */
export default function TabsLayout() {
  const { t } = useApp();
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ tabBarLabel: t('tabHome') }} />
      <Tabs.Screen name="customers" options={{ tabBarLabel: t('tabCustomers') }} />
      <Tabs.Screen name="new" options={{ tabBarLabel: t('newCredit') }} />
      <Tabs.Screen name="reports" options={{ tabBarLabel: t('tabReports') }} />
      <Tabs.Screen name="more" options={{ tabBarLabel: t('tabMore') }} />
    </Tabs>
  );
}
