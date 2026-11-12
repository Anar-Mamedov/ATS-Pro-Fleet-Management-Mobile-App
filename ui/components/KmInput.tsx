import { useThemeController } from '@/config/theme';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export interface KmInputProps<T extends FieldValues> {
  /** React Hook Form control object */
  control: Control<T>;
  /** Field name from the form (string value, digits only) */
  name: Path<T>;
  /** Error message to display */
  error?: string;
}

// Zorunlu kilometre alanı; bottom sheet formlarında kullanılır, yalnızca rakam kabul eder.
export function KmInput<T extends FieldValues>({ control, name, error }: KmInputProps<T>) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDarkMode = themeName === 'dark';

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: t('required'),
        pattern: { value: /^\d+$/, message: t('invalidNumber') },
      }}
      render={({ field: { onChange, onBlur, value } }) => (
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600">
            {t('km')}
            <Text color="$red10" marginLeft="$1">
              *
            </Text>
          </Text>
          <BottomSheetTextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                color: isDarkMode ? '#ffffff' : '#000000',
                borderColor: error ? '#ff0000' : isDarkMode ? '#333' : '#ddd',
              },
            ]}
            placeholder={t('enterKm')}
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            keyboardType="number-pad"
            value={value}
            onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
            onBlur={onBlur}
          />
          {error ? (
            <Text color="$red10" fontSize="$2">
              {error}
            </Text>
          ) : null}
        </YStack>
      )}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
});
