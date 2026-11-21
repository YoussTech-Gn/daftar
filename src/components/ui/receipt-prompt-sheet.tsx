import { useCallback, useEffect } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { MessageCircle, MessageSquare } from '@/components/icons';
import type { ReceiptPayload } from '@/lib/receipt';
import { useApp } from '@/state/use-app';
import { DURATION, EASING, SPRING, useTheme } from '@/theme';
import { DaftarButton } from './daftar-button';
import { DaftarText } from './text';

/** Bottom sheet prompting the shopkeeper to share a WhatsApp or SMS receipt after saving an entry. */
export function ReceiptPromptSheet({
  payload,
  onDone,
}: {
  payload: ReceiptPayload | null;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const visible = payload !== null;

  const translateY = useSharedValue(380);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      translateY.set(0);
      backdropOpacity.set(withTiming(1, { duration: 160, easing: EASING.enter }));
      return;
    }
    translateY.set(380);
    backdropOpacity.set(withTiming(1, { duration: DURATION.enter, easing: EASING.enter }));
    translateY.set(withSpring(0, SPRING.sheet));
  }, [backdropOpacity, reducedMotion, translateY, visible]);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      backdropOpacity.set(
        withTiming(0, { duration: 110, easing: EASING.exit }, (finished) => {
          if (finished) scheduleOnRN(onDone);
        }),
      );
      return;
    }
    backdropOpacity.set(withTiming(0, { duration: DURATION.exit, easing: EASING.exit }));
    translateY.set(
      withTiming(400, { duration: DURATION.exit, easing: EASING.exit }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }),
    );
  }, [backdropOpacity, onDone, reducedMotion, translateY]);

  const pan = usePanGesture({
    onUpdate: (event) => {
      if (event.translationY > 0) translateY.set(event.translationY);
    },
    onDeactivate: (event) => {
      if (event.translationY > 80 || event.velocityY > 600) {
        if (reducedMotion) {
          scheduleOnRN(onDone);
          return;
        }
        backdropOpacity.set(withTiming(0, { duration: DURATION.exit, easing: EASING.exit }));
        translateY.set(
          withTiming(420, { duration: DURATION.exit, easing: EASING.exit }, (finished) => {
            if (finished) scheduleOnRN(onDone);
          }),
        );
      } else {
        translateY.set(withSpring(0, SPRING.sheet));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!payload) return null;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
    onDone();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, { backgroundColor: colors.overlay }, backdropStyle]}>
          <Pressable style={styles.backdropTap} onPress={dismiss} accessibilityLabel={t('notNow')} />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 20) + 8,
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />

            <View style={styles.headerBlock}>
              <DaftarText role="title" weight="700">
                {t('sendReceiptTitle')}
              </DaftarText>
              <DaftarText role="body" tone="secondary">
                {t('sendReceiptBody', { name: payload.customerName })}
              </DaftarText>
            </View>

            <View style={[styles.previewBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
              <DaftarText role="caption" tone="secondary" numberOfLines={3}>
                {payload.text}
              </DaftarText>
            </View>

            <View style={styles.actions}>
              <DaftarButton
                label={t('sendWhatsApp')}
                icon={MessageCircle}
                variant="whatsapp"
                onPress={() => openUrl(payload.whatsappUrl)}
              />
              <DaftarButton
                label={t('sendSms')}
                icon={MessageSquare}
                variant="secondary"
                onPress={() => openUrl(payload.smsUrl)}
              />
              <DaftarButton label={t('notNow')} variant="ghost" onPress={dismiss} />
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 9999,
    alignSelf: 'center',
    marginBottom: 4,
  },
  headerBlock: {
    gap: 6,
  },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    gap: 10,
  },
});
