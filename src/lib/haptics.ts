import * as Haptics from 'expo-haptics';

/** Weighted Magnetic tactile confirmations; failures (e.g. unsupported devices) are ignored. */
export const haptic = {
  selection: () => Haptics.selectionAsync().catch(() => undefined),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
  /** Alias preserved for compact call sites. */
  tap: () => Haptics.selectionAsync().catch(() => undefined),
};
