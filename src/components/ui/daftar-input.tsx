import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AlertCircle, ICON_SCALE } from '@/components/icons';
import { useApp } from '@/state/use-app';
import { getFontFamily, NUMERIC_TEXT_STYLE, useTheme } from '@/theme';
import { DaftarText, Row } from './text';

export interface DaftarInputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
}

/** Indigo Atelier input (>= 48dp height, 1.5dp focus ring, dangerSoft inline error with AlertCircle). */
export function DaftarInput({
  label,
  error,
  prefix,
  style,
  onFocus,
  onBlur,
  ...props
}: DaftarInputProps) {
  const { colors } = useTheme();
  const { isRTL, settings } = useApp();
  const [focused, setFocused] = useState(false);

  const hasError = Boolean(error);
  const borderColor = hasError ? colors.danger : focused ? colors.focus : colors.borderStrong;
  const backgroundColor = hasError ? colors.dangerSoft : colors.surface;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <DaftarText role="label" tone="secondary" weight="600">
          {label}
        </DaftarText>
      ) : null}

      <View
        style={[
          styles.fieldContainer,
          {
            borderColor,
            backgroundColor,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}>
        {prefix ? (
          <View style={[styles.prefixPill, { backgroundColor: colors.surfaceSunken }]}>
            <Text
              style={[
                styles.prefixText,
                NUMERIC_TEXT_STYLE,
                {
                  color: colors.textSecondary,
                  fontFamily: getFontFamily(settings.language, '600'),
                },
              ]}>
              {`\u2066${prefix}\u2069`}
            </Text>
          </View>
        ) : null}

        <TextInput
          placeholderTextColor={colors.textMuted}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: getFontFamily(settings.language, '400'),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
            style,
          ]}
        />
      </View>

      {hasError ? (
        <Row gap={6}>
          <AlertCircle size={ICON_SCALE.xs.size} color={colors.danger} strokeWidth={ICON_SCALE.xs.strokeWidth} />
          <DaftarText role="caption" tone="danger" weight="600" style={{ flexShrink: 1 }}>
            {error}
          </DaftarText>
        </Row>
      ) : null}
    </View>
  );
}

export const Field = DaftarInput;

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  fieldContainer: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 10,
  },
  prefixPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prefixText: {
    fontSize: 14,
    lineHeight: 18,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 8,
  },
});
