import * as Haptics from 'expo-haptics';

/** Small tactile confirmations (analysis 0002 — "instant feedback"). Failures are ignored. */
export const haptic = {
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
  tap: () => Haptics.selectionAsync().catch(() => undefined),
};
