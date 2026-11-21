import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type TextInputProps } from 'react-native';

import { Field, Txt } from '@/components/ui';
import type { TranslationKey } from '@/i18n/translations';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** Text field bound to React Hook Form; shows the translated Zod error under it. */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: { control: Control<T>; name: Path<T>; label: string } & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const { t } = useApp();
  const palette = usePalette();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={{ gap: 4 }}>
          <Field
            label={label}
            value={field.value as string}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            {...inputProps}
          />
          {fieldState.error?.message ? (
            <Txt size={13} style={{ color: palette.danger }}>
              {t(fieldState.error.message as TranslationKey)}
            </Txt>
          ) : null}
        </View>
      )}
    />
  );
}
