import type { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChartPie, Ellipsis, House, ICON_SCALE, Plus, Users, type LucideIcon } from '@/components/icons';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { DURATION, EASING, getFontFamily, SPRING, useTheme } from '@/theme';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: House,
  customers: Users,
  reports: ChartPie,
  more: Ellipsis,
};

/** 54x54 squircle Sahel Indigo center FAB with 3dp bg cutout and spring feedback. */
export function CenterCreditFAB() {
  const { colors, shadows } = useTheme();
  const { t } = useApp();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -13 }, { scale: scale.value }],
  }));

  const onPressIn = () => {
    haptic.medium();
    if (reducedMotion) return;
    scale.set(withSpring(0.92, SPRING.fab));
  };

  const onPressOut = () => {
    if (reducedMotion) return;
    scale.set(withSpring(1, SPRING.fab));
  };

  return (
    <View style={styles.fabSlot}>
      <Animated.View style={animatedStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('newCredit')}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push({ pathname: '/pick-customer', params: { kind: 'credit' } })}
          style={[
            styles.fab,
            shadows.fab,
            {
              backgroundColor: colors.primary,
              borderColor: colors.bg,
            },
          ]}>
          <Plus size={ICON_SCALE.lg.size} color={colors.onPrimary} strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function TabSlotButton({
  routeName,
  label,
  focused,
  onPress,
  onLongPress,
}: {
  routeName: string;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const { settings } = useApp();
  const reducedMotion = useReducedMotion();

  const pillScale = useSharedValue(focused ? 1 : 0.75);
  const pillOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      pillScale.set(focused ? 1 : 0.75);
      pillOpacity.set(focused ? 1 : 0);
      return;
    }
    if (focused) {
      pillScale.set(withSpring(1, SPRING.tabIndicator));
      pillOpacity.set(withTiming(1, { duration: 180, easing: EASING.enter }));
    } else {
      pillScale.set(withTiming(0.75, { duration: DURATION.exit, easing: EASING.exit }));
      pillOpacity.set(withTiming(0, { duration: DURATION.exit, easing: EASING.exit }));
    }
  }, [focused, pillOpacity, pillScale, reducedMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
    opacity: pillOpacity.value,
  }));

  const Icon = TAB_ICONS[routeName] ?? House;
  const tint = focused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      onLongPress={onLongPress}
      style={styles.tabSlot}>
      <View style={styles.pillWrap}>
        <Animated.View style={[styles.activePill, { backgroundColor: colors.primarySoft }, pillStyle]} />
        <Icon size={ICON_SCALE.md.size} color={tint} strokeWidth={focused ? 2.1 : ICON_SCALE.md.strokeWidth} />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            color: tint,
            fontFamily: getFontFamily(settings.language, focused ? '600' : '500'),
            letterSpacing: settings.language === 'ar' ? 0 : 0.15,
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 5-slot Indigo Atelier bottom bar: Home · Customers · [+] · Reports · More. */
export function BottomTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const { colors, shadows } = useTheme();
  const { isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 6);

  return (
    <View
      style={[
        styles.bar,
        shadows.tabBar,
        {
          backgroundColor: colors.surfaceRaised,
          height: 68 + bottomPad,
          paddingBottom: bottomPad,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}>
      {state.routes.map((route, index) => {
        if (route.name === 'new') {
          return <CenterCreditFAB key={route.key} />;
        }
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
        const label = typeof rawLabel === 'string' ? rawLabel : route.name;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        const onLongPress = () => {
          emitter.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabSlotButton
            key={route.key}
            routeName={route.name}
            label={label}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabSlot: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pillWrap: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
