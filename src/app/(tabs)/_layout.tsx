import { Tabs } from 'expo-router';

import { FloatingDock } from '@/components/v4/floating-dock';
import { NewCustomerSheet } from '@/components/v4/new-customer-sheet';
import { OperationSheet } from '@/components/v4/operation-sheet';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/**
 * V4 navigation (decision 0018): floating smoked-glass dock (Accueil · Clients · Rapports · Plus)
 * with a detached "+" FAB. The two sheets live here so every tab can open them.
 */
export default function TabsLayout() {
  const { t } = useApp();
  const { colors } = useTheme();

  return (
    <>
      <Tabs
        tabBar={(props) => <FloatingDock {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}>
        <Tabs.Screen name="index" options={{ tabBarLabel: t('tabHome') }} />
        <Tabs.Screen name="customers" options={{ tabBarLabel: t('tabCustomers') }} />
        <Tabs.Screen name="reports" options={{ tabBarLabel: t('tabReports') }} />
        <Tabs.Screen name="more" options={{ tabBarLabel: t('tabMore') }} />
      </Tabs>
      <OperationSheet />
      <NewCustomerSheet />
    </>
  );
}
