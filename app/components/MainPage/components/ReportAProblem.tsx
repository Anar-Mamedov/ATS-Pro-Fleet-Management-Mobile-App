import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { DatePicker } from '@/ui/components/DatePicker';
import { NumaratorOnAdd } from '@/ui/components/NumaratorOnAdd';
import TalepOncelik from '@/ui/components/TalepOncelik';
import { LocationPicker } from '@/ui/components/LocationPicker';
import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';

interface ReportAProblemForm {
  arizaNo: string;
  problemDate: Date;
  oncelik: string;
  lokasyon: string;
  description: string;
}

interface ReportAProblemProps {
  aracId?: number;
  talepEdenId?: number;
}

function ReportAProblem({ aracId = 0, talepEdenId = 0 }: ReportAProblemProps) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [loading, setLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportAProblemForm>({
    defaultValues: {
      arizaNo: '',
      problemDate: new Date(),
      oncelik: '',
      lokasyon: '',
      description: '',
    },
  });

  const onSubmit = async (data: ReportAProblemForm) => {
    try {
      setLoading(true);

      const requestData = {
        talepNo: data.arizaNo,
        aracId: aracId,
        lokasyonId: selectedLocationId,
        aciklama: data.description,
        tarih: data.problemDate.toISOString().split('T')[0], // YYYY-MM-DD formatında
        talepDurum: 'beklemede', // Varsayılan değer
        talepOncelik: data.oncelik,
        talepTur: 'ariza', // Varsayılan değer
        talepEdenId: talepEdenId,
      };

      await apiService.addRequestItem(requestData);
      Alert.alert(t('success'), t('problemReportedSuccessfully') || 'Talep başarıyla oluşturuldu');
      reset();
      setSelectedLocationId(0);
    } catch (error: any) {
      console.error('Error reporting problem:', error);
      Alert.alert(t('error'), error.message || t('problemReportError') || 'Talep oluşturulurken hata oluştu');
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

        <NumaratorOnAdd
          control={control}
          name="arizaNo"
          label={t('faultNumber') || 'Fault No'}
          placeholder={t('enterFaultNumber') || 'Fault numarası giriniz'}
          error={errors.arizaNo?.message}
          moduleCode="TALEP_BILDIRIM"
          tableName="HasarTakibi"
          required
        />

        <DatePicker control={control} name="problemDate" label={t('problemDate')} placeholder={t('selectDate')} error={errors.problemDate?.message} required />

        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600">
            {t('priority') || 'Öncelik'}
            <Text color="$red10" marginLeft="$1">
              *
            </Text>
          </Text>
          <TalepOncelik
            control={control}
            name="oncelik"
            rules={{
              required: t('priorityRequired') || 'Öncelik seçimi zorunludur',
            }}
            placeholder={t('selectPriority') || 'Öncelik seçin'}
          />
          {errors.oncelik && (
            <Text color="$red10" fontSize="$2">
              {errors.oncelik.message}
            </Text>
          )}
        </YStack>

        <LocationPicker
          control={control}
          name="lokasyon"
          label={t('location') || 'Lokasyon'}
          placeholder={t('selectLocation') || 'Lokasyon seçin'}
          error={errors.lokasyon?.message}
          required
          onSubmit={(data) => {
            if (data && !Array.isArray(data)) {
              setSelectedLocationId(data.locationId);
            }
          }}
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

        <Button onPress={handleSubmit(onSubmit)} disabled={loading} backgroundColor="$blue10" color="white" fontWeight="600" height={50} borderRadius="$2">
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
