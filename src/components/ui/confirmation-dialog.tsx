import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  AlertCircle,
  Ban,
  HeartHandshake,
  ICON_SCALE,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from '@/components/icons';
import { useApp } from '@/state/use-app';
import { DURATION, EASING, useTheme } from '@/theme';
import { AmountDisplay } from './amount-display';
import { DaftarButton, type DaftarButtonVariant } from './daftar-button';
import { DaftarText } from './text';

export type DialogTone = 'default' | 'forgiven' | 'danger' | 'primary';
export type DialogIconName = 'forgive' | 'trash' | 'cancel' | 'restore' | 'alert';

const ICONS: Record<DialogIconName, LucideIcon> = {
  forgive: HeartHandshake,
  trash: Trash2,
  cancel: Ban,
  restore: RotateCcw,
  alert: AlertCircle,
};

/**
 * Centered Indigo Atelier confirmation modal for Cancel entry, Restore entry,
 * Forgive debt (displays forgiven plum amount callout), and destructive actions.
 */
export function ConfirmationDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  icon = 'alert',
  amount,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: DialogTone;
  icon?: DialogIconName;
  amount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { t, isRTL } = useApp();
  const reducedMotion = useReducedMotion();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      translateY.value = 0;
      opacity.value = withTiming(1, { duration: 160, easing: EASING.enter });
      return;
    }
    opacity.value = 0;
    translateY.value = 14;
    opacity.value = withTiming(1, { duration: DURATION.enter, easing: EASING.enter });
    translateY.value = withTiming(0, { duration: DURATION.enter, easing: EASING.enter });
  }, [opacity, reducedMotion, translateY, visible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const Icon = ICONS[icon];
  const medallionColors =
    tone === 'forgiven'
      ? { bg: colors.forgivenSoft, fg: colors.forgiven }
      : tone === 'danger'
        ? { bg: colors.dangerSoft, fg: colors.danger }
        : { bg: colors.primarySoft, fg: colors.primary };

  const confirmVariant: DaftarButtonVariant =
    tone === 'danger' ? 'danger' : tone === 'forgiven' ? 'forgiven' : 'primary';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={cancelLabel ?? t('cancel')} />
        <Animated.View
          style={[
            styles.dialog,
            shadows.card,
            cardStyle,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}>
          <View style={[styles.medallion, { backgroundColor: medallionColors.bg }]}>
            <Icon size={ICON_SCALE.lg.size} color={medallionColors.fg} strokeWidth={ICON_SCALE.lg.strokeWidth} />
          </View>

          <DaftarText role="heading" weight="700" align="center">
            {title}
          </DaftarText>

          {amount !== undefined ? (
            <View
              style={[
                styles.amountBox,
                {
                  backgroundColor: tone === 'forgiven' ? colors.forgivenSoft : colors.surfaceSunken,
                },
              ]}>
              <AmountDisplay
                amount={amount}
                size="title"
                alwaysVisible
                color={tone === 'forgiven' ? colors.forgiven : colors.text}
                align="center"
              />
            </View>
          ) : null}

          <DaftarText role="body" tone="secondary" align="center">
            {body}
          </DaftarText>

          <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <DaftarButton
              label={cancelLabel ?? t('cancel')}
              variant="secondary"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <DaftarButton
              label={confirmLabel}
              variant={confirmVariant}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  medallion: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBox: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  actionsRow: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
});
