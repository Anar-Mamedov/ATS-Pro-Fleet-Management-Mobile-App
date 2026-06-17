import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { DatePicker } from '@/ui/components/DatePicker';
import { NumaratorOnAdd } from '@/ui/components/NumaratorOnAdd';
import TalepOncelik from '@/ui/components/TalepOncelik';
import TalepTuru from '@/ui/components/TalepTuru';

import { PhotoUploadButton } from '@/ui/components/PhotoUploadButton';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput } from 'react-native';

interface ReportAProblemForm {
  arizaNo: string;
  problemDate: Date;
  oncelik: string;
  talepTuru?: string;
  lokasyon: string;
  description: string;
}

interface ReportAProblemProps {
  aracId?: number;
  talepEdenId?: number;
  onSuccess?: () => void;
  mode?: 'ariza' | 'talep'; // 'ariza' için Arıza Bildir, 'talep' için Talep Bildir
  initialLocationId?: number;
  initialLocationName?: string;
}

function ReportAProblem({ aracId = 0, talepEdenId = 0, onSuccess, mode = 'ariza', initialLocationId, initialLocationName }: ReportAProblemProps) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [loading, setLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(initialLocationId || 0);
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; fileName: string }[]>([]);

  const isTalepMode = mode === 'talep';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportAProblemForm>({
    defaultValues: {
      arizaNo: '',
      problemDate: new Date(),
      oncelik: 'orta',
      talepTuru: '',
      lokasyon: initialLocationName || '',
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
        talepTur: isTalepMode ? (data.talepTuru || 'ariza') : 'ariza', // Talep modunda talepTuru kullan, arıza modunda 'ariza'
        talepEdenId: talepEdenId,
      };

      const response = await apiService.addRequestItem(requestData);
      console.log('========================================');
      console.log('AddRequestItem FULL RESPONSE:', JSON.stringify(response, null, 2));
      console.log('Response type:', typeof response);
      console.log('Response.status:', response?.status);
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      console.log('Has selectedPhotos:', selectedPhotos.length);
      if (selectedPhotos.length > 0) {
        console.log('SelectedPhotos:', selectedPhotos);
      }
      console.log('========================================');

      // Eğer resimler seçildiyse ve form başarıyla eklendiyse resimleri upload et
      // Response formatı: { status: true, statusCode: 200, data: 3, message: "..." }
      if (response?.status === true && response?.data && selectedPhotos.length > 0) {
        try {
          const recordId = Number(response.data);
          console.log('Starting photos upload for refId:', recordId);

          // Tüm resimleri sırayla yükle
          const uploadPromises = selectedPhotos.map(async (photo, index) => {
            const ext = photo.fileName.split('.').pop() || 'jpg';
            const mimeType = getMimeTypeFromExtension(ext);

            const fileDetails = {
              uri: photo.uri,
              name: photo.fileName,
              type: mimeType,
            };

            console.log(`Uploading photo ${index + 1}/${selectedPhotos.length}:`, { refId: recordId, refGroup: 'TALEP_BILDIRIM', fileName: photo.fileName });
            return apiService.uploadPhoto(fileDetails, recordId, 'TALEP_BILDIRIM', false);
          });

          const uploadResults = await Promise.all(uploadPromises);
          console.log('All photos uploaded successfully:', uploadResults);
        } catch (uploadError: any) {
          console.error('Photo upload error:', uploadError);
          Alert.alert(
            t('warning') || 'Uyarı',
            t('photoUploadError') || 'Talep oluşturuldu ancak bazı resimler yüklenirken hata oluştu'
          );
        }
      } else {
        console.log('Skipping photo upload:', {
          status: response?.status,
          hasData: !!response?.data,
          dataValue: response?.data,
          hasPhotos: selectedPhotos.length
        });
      }

      const successMessage = isTalepMode
        ? t('requestSubmittedSuccessfully') || 'Talep başarıyla oluşturuldu'
        : t('problemReportedSuccessfully') || 'Arıza başarıyla bildirildi';

      Alert.alert(t('success'), successMessage);
      reset();
      setSelectedLocationId(0);
      setSelectedPhotos([]);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error reporting problem:', error);
      Alert.alert(t('error'), error.message || t('problemReportError') || 'Talep oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getMimeTypeFromExtension = (ext: string): string => {
    const lower = (ext || '').toLowerCase().replace(/^\./, '');
    switch (lower) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
      case 'heif':
        return 'image/heic';
      default:
        return 'image/jpeg';
    }
  };

  const isDarkMode = themeName === 'dark';
  const dateLabel = isTalepMode ? t('requestDate') || 'Talep Tarihi' : t('problemDate');

  return (
    <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$6" fontWeight="bold">
          {isTalepMode ? t('talepBildir') || 'Talep Bildir' : t('reportAProblem')}
        </Text>

        <NumaratorOnAdd
          control={control}
          name="arizaNo"
          label={isTalepMode ? t('requestNumber') || 'Talep No' : t('faultNumber') || 'Arıza No'}
          placeholder={isTalepMode ? t('enterRequestNumber') || 'Talep numarası giriniz' : t('enterFaultNumber') || 'Arıza numarası giriniz'}
          error={errors.arizaNo?.message}
          moduleCode="TALEP_BILDIRIM"
          tableName="HasarTakibi"
          required
        />

        <DatePicker control={control} name="problemDate" label={dateLabel} placeholder={t('selectDate')} error={errors.problemDate?.message} required />

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

        {isTalepMode && (
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="600">
              {t('talepTuru') || 'Talep Türü'}
              <Text color="$red10" marginLeft="$1">
                *
              </Text>
            </Text>
            <TalepTuru
              control={control}
              name="talepTuru"
              rules={{
                required: t('talepTuruRequired') || 'Talep türü seçimi zorunludur',
              }}
              placeholder={t('selectTalepTuru') || 'Talep türü seçin'}
            />
            {errors.talepTuru && (
              <Text color="$red10" fontSize="$2">
                {errors.talepTuru.message}
              </Text>
            )}
          </YStack>
        )}

        {/* LocationPicker gizlendi - lokasyon verisi initialLocationId üzerinden backend'e gönderilmeye devam ediyor */}

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

        <PhotoUploadButton
          selectedPhotos={selectedPhotos}
          onPhotosChange={setSelectedPhotos}
          disabled={loading}
          label={t('photos') || 'Fotoğraflar'}
          isDarkMode={isDarkMode}
          maxPhotos={10}
        />

        <Button onPress={handleSubmit(onSubmit)} disabled={loading} backgroundColor="$blue10" color="white" fontWeight="600" height={50} borderRadius="$2">
          {loading ? t('submitting') : t('submit')}
        </Button>
      </YStack>
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
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
