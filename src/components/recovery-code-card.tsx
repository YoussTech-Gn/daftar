import { StyleSheet, View } from 'react-native';

import { ICON_SCALE, KeyRound } from '@/components/icons';
import { DaftarButton, DaftarText } from '@/components/ui';
import { formatRecoveryCode } from '@/security/recovery-code';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** Shows a freshly created recovery code once, and asks the shopkeeper to write it on paper. */
export function RecoveryCodeCard({ code, onConfirm }: { code: string; onConfirm: () => void }) {
  const { t } = useApp();
  const { colors, shadows } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.medallion, { backgroundColor: colors.primarySoft }]}>
        <KeyRound size={ICON_SCALE.lg.size} color={colors.primary} strokeWidth={ICON_SCALE.lg.strokeWidth} />
      </View>
      <DaftarText role="title" weight="700" align="center">
        {t('recoveryTitle')}
      </DaftarText>

      <View
        style={[styles.codeBox, shadows.card, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
        accessible
        accessibilityLabel={code.split('').join(' ')}>
        {/* Always left-to-right, even in Arabic: it is copied character by character. */}
        <DaftarText role="title" weight="800" numeric align="center" style={styles.codeText}>
          {`⁦${formatRecoveryCode(code)}⁩`}
        </DaftarText>
      </View>

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
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  codeText: {
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 2,
  },
});
