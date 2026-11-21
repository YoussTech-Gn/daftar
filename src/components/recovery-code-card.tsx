import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Copy, ICON_SCALE, KeyRound } from '@/components/icons';
import { DaftarButton, DaftarText } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { formatRecoveryCode } from '@/security/recovery-code';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/**
 * Shows a freshly created recovery code once, and asks the shopkeeper to write it on paper.
 * V4 (decision 0018): JetBrains Mono, tap-to-copy glass card.
 */
export function RecoveryCodeCard({ code, onConfirm }: { code: string; onConfirm: () => void }) {
  const { t } = useApp();
  const { colors, shadows } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);
  const formatted = formatRecoveryCode(code);

  return (
    <View style={styles.wrap}>
      <View style={[styles.medallion, { backgroundColor: colors.primarySoft }]}>
        <KeyRound size={ICON_SCALE.lg.size} color={colors.primary} strokeWidth={ICON_SCALE.lg.strokeWidth} />
      </View>
      <DaftarText role="title" weight="700" align="center">
        {t('recoveryTitle')}
      </DaftarText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${code.split('').join(' ')}. ${t('tapToCopy')}`}
        onPress={async () => {
          await Clipboard.setStringAsync(formatted);
          haptic.success();
          showToast(t('codeCopied'));
        }}
        style={({ pressed }) => [
          styles.codeBox,
          shadows.card,
          { backgroundColor: pressed ? colors.surfaceSunken : colors.surface, borderColor: colors.borderStrong },
        ]}>
        {/* Always left-to-right, even in Arabic: it is copied character by character. */}
        <Text style={[styles.codeText, { color: colors.text }]}>{`⁦${formatted}⁩`}</Text>
        <View style={styles.copyHint}>
          <Copy size={14} color={colors.textSecondary} strokeWidth={1.9} />
          <DaftarText role="caption" tone="secondary">
            {t('tapToCopy')}
          </DaftarText>
        </View>
      </Pressable>

      <DaftarText role="body" tone="secondary" align="center">
        {t('recoveryBody')}
      </DaftarText>

      <DaftarButton label={t('recoveryWritten')} onPress={onConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'stretch',
    gap: 18,
  },
  medallion: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  codeBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  codeText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 25,
    lineHeight: 34,
    letterSpacing: 1,
    textAlign: 'center',
  },
  copyHint: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
