import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';
import { DatePicker } from '@/ui/components/DatePicker';
import { useThemeController } from '@/config/theme';

interface ReportAProblemForm {
  problemDate: Date;
  description: string;
}

function ReportAProblem() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportAProblemForm>({
    defaultValues: {
      problemDate: new Date(),
      description: '',
    },
  });

  const onSubmit = async (data: ReportAProblemForm) => {
    try {
      setLoading(true);
      console.log('Problem report:', data);

      // API çağrısı burada yapılacak
      Alert.alert(t('success'), t('problemReportedSuccessfully'));
      reset();
    } catch (error: any) {
      console.error('Error reporting problem:', error);
      Alert.alert(t('error'), error.message || t('problemReportError'));
    } finally {
      setLoading(false);
    }
  };

  const isDarkMode = themeName === 'dark';

  return (
    <ScrollView style={styles.container}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$6" fontWeight="bold">
          {t('reportAProblem')}
        </Text>

        <DatePicker
          control={control}
          name="problemDate"
          label={t('problemDate')}
          placeholder={t('selectDate')}
          error={errors.problemDate?.message}
          required
        />

        <Controller
          control={control}
          name="description"
          rules={{
            required: t('descriptionRequired') || 'Description is required',
            minLength: {
              value: 10,
              message: t('descriptionMinLength') || 'Description must be at least 10 characters',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                {t('description')}
                <Text color="$red10" marginLeft="$1">
                  *
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                    color: isDarkMode ? '#ffffff' : '#000000',
                    borderColor: errors.description ? '#ff0000' : isDarkMode ? '#333' : '#ddd',
                  },
                ]}
                placeholder={t('describeProblem')}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              {errors.description && (
                <Text color="$red10" fontSize="$2">
                  {errors.description.message}
                </Text>
              )}
            </YStack>
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          backgroundColor="$blue10"
          color="white"
          fontWeight="600"
          height={50}
          borderRadius="$2"
        >
          {loading ? t('submitting') : t('submit')}
        </Button>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 120,
  },
});

export default ReportAProblem;
