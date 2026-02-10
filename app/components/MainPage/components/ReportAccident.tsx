import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { DatePicker } from '@/ui/components/DatePicker';
import { PhotoUploadButton } from '@/ui/components/PhotoUploadButton';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, Pressable, StyleSheet, TextInput } from 'react-native';

interface ReportAccidentForm {
  plaka: string;
  surucu: string;
  kazaTarihi: Date;
  saat: Date;
  aciklama: string;
}

interface ReportAccidentProps {
  aracId: number;
  plaka: string;
  surucuId: number;
  surucuAd: string;
  lokasyonId: number;
  onSuccess?: () => void;
}

function ReportAccident({ aracId, plaka, surucuId, surucuAd, lokasyonId, onSuccess }: ReportAccidentProps) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; fileName: string }[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date | null>(null);
  const [renderPicker, setRenderPicker] = useState(false);

  const isDarkMode = themeName === 'dark';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportAccidentForm>({
    defaultValues: {
      plaka: plaka || '',
      surucu: surucuAd || '',
      kazaTarihi: new Date(),
      saat: new Date(),
      aciklama: '',
    },
  });

  React.useEffect(() => {
    if (showTimePicker) {
      const timer = setTimeout(() => setRenderPicker(true), 50);
      return () => clearTimeout(timer);
    } else {
      setRenderPicker(false);
    }
  }, [showTimePicker]);

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

  const onSubmit = async (data: ReportAccidentForm) => {
    try {
      setLoading(true);

      const requestData = {
        aracId: aracId,
        surucuId: surucuId,
        aciklama: data.aciklama,
        kazaTarih: dayjs(data.kazaTarihi).format('YYYY-MM-DD'),
        kazaSaat: dayjs(data.saat).format('HH:mm'),
        lokasyonId: lokasyonId,
      };

      const response = await apiService.addAccidentItem(requestData);

      if (response?.status === true && response?.data && selectedPhotos.length > 0) {
        try {
          const recordId = Number(response.data);

          const uploadPromises = selectedPhotos.map(async (photo) => {
            const ext = photo.fileName.split('.').pop() || 'jpg';
            const mimeType = getMimeTypeFromExtension(ext);

            const fileDetails = {
              uri: photo.uri,
              name: photo.fileName,
              type: mimeType,
            };

            return apiService.uploadPhoto(fileDetails, recordId, 'KAZA', false);
          });

          await Promise.all(uploadPromises);
        } catch (uploadError: unknown) {
          console.error('Photo upload error:', uploadError);
          Alert.alert(
            t('warning') || 'Uyarı',
            t('photoUploadError') || 'Kaza bildirildi ancak bazı resimler yüklenirken hata oluştu'
          );
        }
      }

      Alert.alert(t('success'), t('kazaReportedSuccessfully') || 'Kaza başarıyla bildirildi');
      reset({
        plaka: plaka || '',
        surucu: surucuAd || '',
        kazaTarihi: new Date(),
        saat: new Date(),
        aciklama: '',
      });
      setSelectedPhotos([]);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error reporting accident:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      Alert.alert(t('error'), errorMessage || t('kazaReportError') || 'Kaza bildirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$6" fontWeight="bold">
          {t('kazaBildir') || 'Kaza Bildir'}
        </Text>

        {/* Plaka - Read Only */}
        <Controller
          control={control}
          name="plaka"
          render={({ field: { value } }) => (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                {t('plaka') || 'Plaka'}
              </Text>
              <Input
                value={value}
                editable={false}
                opacity={0.7}
                borderColor="$borderColor"
              />
            </YStack>
          )}
        />

        {/* Sürücü - Read Only */}
        <Controller
          control={control}
          name="surucu"
          render={({ field: { value } }) => (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                {t('surucu') || 'Sürücü'}
              </Text>
              <Input
                value={value}
                editable={false}
                opacity={0.7}
                borderColor="$borderColor"
              />
            </YStack>
          )}
        />

        {/* Kaza Tarihi */}
        <DatePicker
          control={control}
          name="kazaTarihi"
          label={t('kazaTarihi') || 'Kaza Tarihi'}
          placeholder={t('selectDate')}
          error={errors.kazaTarihi?.message}
          required
        />

        {/* Saat - Time Picker */}
        <Controller
          control={control}
          name="saat"
          render={({ field: { onChange, value } }) => {
            const selectedTime = value instanceof Date ? value : new Date();
            const displayTime = dayjs(selectedTime).format('HH:mm');

            const handleShowTimePicker = () => {
              setTempTime(selectedTime);
              setShowTimePicker(true);
            };

            const handleAndroidTimeChange = (event: DateTimePickerEvent, date?: Date) => {
              setShowTimePicker(false);
              if (event.type === 'set' && date) {
                onChange(date);
              }
            };

            const handleIOSTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
              if (date) {
                setTempTime(date);
              }
            };

            const handleTimeConfirm = () => {
              if (tempTime) {
                onChange(tempTime);
              }
              setShowTimePicker(false);
            };

            const handleTimeCancel = () => {
              setShowTimePicker(false);
              setTempTime(null);
            };

            return (
              <YStack gap="$2">
                <Text fontSize="$3" fontWeight="600">
                  {t('accidentTime') || 'Saat'}
                  <Text color="$red10" marginLeft="$1">
                    *
                  </Text>
                </Text>

                <Pressable onPress={handleShowTimePicker}>
                  <Input
                    value={displayTime}
                    placeholder={t('selectTime') || 'Saat seçin'}
                    editable={false}
                    pointerEvents="none"
                    borderColor="$borderColor"
                  />
                </Pressable>

                {Platform.OS === 'ios' ? (
                  <Modal
                    visible={showTimePicker}
                    transparent
                    animationType="none"
                    onRequestClose={handleTimeCancel}
                  >
                    <Pressable
                      style={styles.modalOverlay}
                      onPress={handleTimeCancel}
                    >
                      <Pressable onPress={(e) => e.stopPropagation()}>
                        <YStack
                          backgroundColor="$background"
                          paddingBottom="$4"
                          borderTopLeftRadius="$4"
                          borderTopRightRadius="$4"
                        >
                          <YStack
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                            padding="$3"
                            borderBottomWidth={1}
                            borderColor="$borderColor"
                          >
                            <Button size="$3" chromeless onPress={handleTimeCancel}>
                              <Text>{t('cancel') || 'İptal'}</Text>
                            </Button>
                            <Button size="$3" chromeless onPress={handleTimeConfirm}>
                              <Text fontWeight="600">{t('confirm') || 'Onayla'}</Text>
                            </Button>
                          </YStack>
                          <YStack alignItems="center" paddingVertical="$2">
                            {renderPicker && (
                              <DateTimePicker
                                value={tempTime || selectedTime}
                                mode="time"
                                display="spinner"
                                onChange={handleIOSTimeChange}
                                style={{ width: '100%' }}
                              />
                            )}
                          </YStack>
                        </YStack>
                      </Pressable>
                    </Pressable>
                  </Modal>
                ) : (
                  showTimePicker && (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      display="default"
                      onChange={handleAndroidTimeChange}
                    />
                  )
                )}
              </YStack>
            );
          }}
        />

        {/* Açıklama */}
        <Controller
          control={control}
          name="aciklama"
          rules={{
            required: t('descriptionRequired') || 'Açıklama zorunludur',
            minLength: {
              value: 10,
              message: t('descriptionMinLength') || 'Açıklama en az 10 karakter olmalıdır',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                {t('kazaAciklamasi') || 'Açıklama'}
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
                    borderColor: errors.aciklama ? '#ff0000' : isDarkMode ? '#333' : '#ddd',
                  },
                ]}
                placeholder={t('kazaAciklamasi') || 'Kaza açıklaması'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              {errors.aciklama && (
                <Text color="$red10" fontSize="$2">
                  {errors.aciklama.message}
                </Text>
              )}
            </YStack>
          )}
        />

        {/* Resimler */}
        <PhotoUploadButton
          selectedPhotos={selectedPhotos}
          onPhotosChange={setSelectedPhotos}
          disabled={loading}
          label={t('photos') || 'Fotoğraflar'}
          isDarkMode={isDarkMode}
          maxPhotos={5}
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default ReportAccident;
