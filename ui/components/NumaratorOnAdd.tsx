import { Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useRef, useState } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput } from 'react-native';
import { apiService } from '../../services/apiService';
import { useThemeController } from '../../config/theme';

export interface NumaratorOnAddProps<T extends FieldValues> {
  /** React Hook Form control object */
  control: Control<T>;
  /** Field name from the form */
  name: Path<T>;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Module code for numerator API (e.g., 'HASAR_TAKIBI_NO') */
  moduleCode: string;
  /** Table name for validation (e.g., 'HasarTakibi') */
  tableName: string;
}

export function NumaratorOnAdd<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  required = false,
  moduleCode,
  tableName,
}: NumaratorOnAddProps<T>) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [isEdited, setIsEdited] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const initialValueRef = useRef<string>('');
  const hasFetchedRef = useRef(false);

  const isDarkMode = themeName === 'dark';

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: required ? (t('fieldRequired') || 'Bu alan zorunludur') : false,
        validate: {
          uniqueCode: () => {
            // If there's a validation error, prevent form submission
            if (validationError) {
              return validationError;
            }
            return true;
          },
        },
      }}
      render={({ field: { onChange, value, onBlur } }) => {
        // Fetch numerator code automatically on mount
        if (!hasFetchedRef.current && !value && !initialValueRef.current) {
          hasFetchedRef.current = true;
          (async () => {
            try {
              const data = await apiService.getModuleCodeByCode(moduleCode);
              if (data) {
                onChange(data);
                initialValueRef.current = data;
              }
            } catch (error) {
              console.error('Error fetching numerator code:', error);
            }
          })();
        }

        const handleBlur = async () => {
          // Call the original onBlur from react-hook-form
          onBlur();

          // Validate uniqueness if user changed the value
          if (value && value !== initialValueRef.current) {
            setIsValidating(true);
            setValidationError('');
            try {
              const data = await apiService.isCodeItemExist(tableName, value);

              // If status is true, code already exists (not unique)
              if (data?.status === true) {
                setValidationError(t('codeAlreadyExists') || 'Bu kod zaten kullanımda');
              }
            } catch (error) {
              console.error('Error validating code uniqueness:', error);
            } finally {
              setIsValidating(false);
            }
          }
        };

        const handleChangeText = (text: string) => {
          onChange(text);
          if (!isEdited && text !== initialValueRef.current) {
            setIsEdited(true);
          }
          // Clear validation error when user types
          if (validationError) {
            setValidationError('');
          }
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

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                  color: isDarkMode ? '#ffffff' : '#000000',
                  borderColor: error || validationError ? '#ff0000' : isDarkMode ? '#333' : '#ddd',
                },
              ]}
              value={value || ''}
              onChangeText={handleChangeText}
              onBlur={handleBlur}
              placeholder={placeholder}
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              editable={!isValidating}
            />

            {(error || validationError) && (
              <Text color="$red10" fontSize="$2">
                {error || validationError}
              </Text>
            )}

            {isValidating && (
              <Text color="$blue10" fontSize="$2">
                {t('validating') || 'Doğrulanıyor...'}
              </Text>
            )}
          </YStack>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 50,
  },
});

export { NumaratorOnAdd as default };
