import { BlurView } from 'expo-blur';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChartPie, Ellipsis, House, ICON_SCALE, Plus, Users, type LucideIcon } from '@/components/icons';
import { haptic } from '@/lib/haptics';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme, v4 } from '@/theme';
import { Txt } from './primitives';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, LucideIcon> = {
  index: House,
  customers: Users,
  reports: ChartPie,
  more: Ellipsis,
};

/** Height the dock takes above the safe area; screens pad their scroll content by 112. */
export const DOCK_SPACE = 112;

/**
 * Floating smoked-glass dock (Accueil · Clients · Rapports · Plus) and a detached "+" FAB
 * that opens the "Nouvelle opération" sheet (decision 0018).
 */
export function FloatingDock({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { isRTL, t } = useApp();
  const { colors, scheme } = useTheme();
  const openOperation = useSessionStore((s) => s.openOperation);

  return (
    <View
      pointerEvents="box-none"
      className={`absolute left-0 right-0 items-center gap-3 px-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ bottom: Math.max(insets.bottom, 10) + 6 }}>
      <View className="h-[64px] flex-1 overflow-hidden rounded-[26px] border border-line">
        <BlurView
          intensity={60}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          className="absolute inset-0"
        />
        {/* Android has no cheap live blur behind a view: a near-opaque surface keeps the labels readable. */}
        <View className="absolute inset-0 bg-dock" />
        {Platform.OS === 'android' ? <View className="absolute inset-0 bg-surface-solid opacity-90" /> : null}
        <View className="absolute left-5 right-5 top-0 h-px bg-specular" />
        <View className={`flex-1 items-center px-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          {state.routes.map((route, index) => {
            const Icon = TAB_ICONS[route.name];
            if (!Icon) return null;
            const focused = state.index === index;
            const label = String(descriptors[route.key].options.tabBarLabel ?? route.name);
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={() => {
                  const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    haptic.selection();
                    navigateToTab(route.key);
                  }
                }}
                className="h-full flex-1 items-center justify-center gap-0.5">
                <View className={`rounded-2xl px-3 py-1 ${focused ? 'bg-accent-soft' : ''}`}>
                  <Icon
                    size={ICON_SCALE.md.size}
                    color={focused ? v4(scheme, 'accent') : colors.textSecondary}
                    strokeWidth={focused ? 2.3 : ICON_SCALE.md.strokeWidth}
                  />
                </View>
                <Txt
                  weight={focused ? '700' : '500'}
                  numberOfLines={1}
                  className={`text-[11px] ${focused ? 'text-accent' : 'text-ink-2'}`}>
                  {label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newOperation')}
        onPress={() => {
          haptic.medium();
          openOperation();
        }}
        className="h-[64px] w-[64px] items-center justify-center rounded-[24px] bg-fab-bg active:opacity-80"
        style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
        <Plus size={28} color={v4(scheme, 'fab-fg')} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
