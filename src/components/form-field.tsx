import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { DaftarInput } from '@/components/ui/daftar-input';
import type { TranslationKey } from '@/i18n/translations';
import { useApp } from '@/state/use-app';

/** Text field bound to React Hook Form; passes translated Zod error directly into DaftarInput. */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  prefix,
  ...inputProps
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  prefix?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const { t } = useApp();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DaftarInput
          label={label}
          prefix={prefix}
          value={field.value as string}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message ? t(fieldState.error.message as TranslationKey) : undefined}
          {...inputProps}
        />
      )}
    />
  );
}
