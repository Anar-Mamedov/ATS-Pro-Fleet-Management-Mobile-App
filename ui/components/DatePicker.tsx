import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { XStack, YStack } from '@tamagui/stacks';
import dayjs, { setDayjsLocaleFromI18n } from '../../config/dayjs';
import React, { useEffect, useState } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [renderPicker, setRenderPicker] = useState(false);

  useEffect(() => {
    setDayjsLocaleFromI18n(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (show) {
      // Delay picker rendering to let modal animation complete
      const timer = setTimeout(() => setRenderPicker(true), 50);
      return () => clearTimeout(timer);
    } else {
      setRenderPicker(false);
    }
  }, [show]);

  // Map i18n language to iOS locale
  const getIOSLocale = (lang: string): string => {
    const localeMap: Record<string, string> = {
      tr: 'tr_TR',
      en: 'en_US',
      ru: 'ru_RU',
      az: 'az_AZ',
    };
    return localeMap[lang] || 'en_US';
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

        const handleShowPicker = () => {
          setTempDate(selectedDate);
          setShow(true);
        };

        const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
          setShow(false);
          if (event.type === 'set' && date) {
            onChange(date);
          }
        };

        const handleIOSChange = (_event: DateTimePickerEvent, date?: Date) => {
          if (date) {
            setTempDate(date);
          }
        };

        const handleConfirm = () => {
          if (tempDate) {
            onChange(tempDate);
          }
          setShow(false);
        };

        const handleCancel = () => {
          setShow(false);
          setTempDate(null);
        };

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

            <Pressable onPress={handleShowPicker}>
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

            {Platform.OS === 'ios' ? (
              <Modal
                visible={show}
                transparent
                animationType="none"
                onRequestClose={handleCancel}
              >
                <Pressable
                  style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }}
                  onPress={handleCancel}
                >
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <YStack
                      backgroundColor="$background"
                      paddingBottom="$4"
                      borderTopLeftRadius="$4"
                      borderTopRightRadius="$4"
                      animation="quick"
                      enterStyle={{ y: 300, opacity: 0 }}
                      exitStyle={{ y: 300, opacity: 0 }}
                      y={0}
                      opacity={1}
                    >
                      <XStack justifyContent="space-between" alignItems="center" padding="$3" borderBottomWidth={1} borderColor="$borderColor">
                        <Button size="$3" chromeless onPress={handleCancel}>
                          <Text>{t('cancel') || 'Cancel'}</Text>
                        </Button>
                        <Button size="$3" chromeless onPress={handleConfirm}>
                          <Text fontWeight="600">{t('confirm') || 'Confirm'}</Text>
                        </Button>
                      </XStack>
                      <YStack alignItems="center" paddingVertical="$2">
                        {renderPicker && (
                          <DateTimePicker
                            value={tempDate || selectedDate}
                            mode="date"
                            display="spinner"
                            onChange={handleIOSChange}
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            locale={getIOSLocale(i18n.language)}
                            style={{ width: '100%' }}
                          />
                        )}
                      </YStack>
                    </YStack>
                  </Pressable>
                </Pressable>
              </Modal>
            ) : (
              show && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={handleAndroidChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                />
              )
            )}
          </YStack>
        );
      }}
    />
  );
}

export { CustomDatePicker as DatePicker };
export default CustomDatePicker;
