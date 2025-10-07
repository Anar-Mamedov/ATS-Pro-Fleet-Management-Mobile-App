import { Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import dayjs, { setDayjsLocaleFromI18n } from '../../config/dayjs';
import React, { useEffect, useState } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import DatePicker from 'react-native-date-picker';

export interface CustomDatePickerProps<T extends FieldValues> {
  /** React Hook Form control object */
  control: Control<T>;
  /** Field name from the form */
  name: Path<T>;
  /** Label text */
  label?: string;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Day.js format string. Defaults to localized long date (LL). */
  format?: string;
  /** Minimum date that can be selected */
  minimumDate?: Date;
  /** Maximum date that can be selected */
  maximumDate?: Date;
  /** Required field indicator */
  required?: boolean;
}

export function CustomDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  format = 'L',
  minimumDate,
  maximumDate,
  required = false,
}: CustomDatePickerProps<T>) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDayjsLocaleFromI18n(i18n.language);
  }, [i18n.language]);

  // Map i18n language codes to react-native-date-picker locale codes
  const getPickerLocale = (lang: string): string => {
    const localeMap: Record<string, string> = {
      en: 'en',
      tr: 'tr',
      ru: 'ru',
      az: 'az',
    };
    return localeMap[lang] || 'en';
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const selectedDate = value
          ? ((value as any) instanceof Date ? (value as Date) : new Date(value as string | number))
          : new Date();

        const displayValue = value && dayjs(selectedDate).isValid()
          ? dayjs(selectedDate).format(format)
          : '';

        return (
          <YStack gap="$2">
            {label && (
              <Text fontSize="$3" fontWeight="600" marginBottom="$1">
                {label}
                {required && (
                  <Text color="$red10" marginLeft="$1">
                    *
                  </Text>
                )}
              </Text>
            )}

            <Pressable onPress={() => setOpen(true)}>
              <Input
                id={name as string}
                value={displayValue}
                placeholder={placeholder}
                editable={false}
                pointerEvents="none"
                borderColor={error ? '$red10' : '$borderColor'}
              />
            </Pressable>

            {error && (
              <Text color="$red10" fontSize="$2">
                {error}
              </Text>
            )}

            <DatePicker
              modal
              open={open}
              date={selectedDate}
              mode="date"
              locale={getPickerLocale(i18n.language)}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onConfirm={(date) => {
                setOpen(false);
                onChange(date);
              }}
              onCancel={() => {
                setOpen(false);
              }}
              title={label}
              confirmText={t('confirm') || 'Confirm'}
              cancelText={t('cancel') || 'Cancel'}
            />
          </YStack>
        );
      }}
    />
  );
}

export { CustomDatePicker as DatePicker };
export default CustomDatePicker;
