import dayjs from '@/config/dayjs';
import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { DatePicker } from '@/ui/components/DatePicker';
import { KmInput } from '@/ui/components/KmInput';
import { NumaratorOnAdd } from '@/ui/components/NumaratorOnAdd';
import { RequestNotification, RequestNotificationCard, normalizeCode } from '@/ui/components/RequestNotificationCard';
import TalepOncelik from '@/ui/components/TalepOncelik';
import TalepTuru from '@/ui/components/TalepTuru';

import { PhotoUploadButton } from '@/ui/components/PhotoUploadButton';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput } from 'react-native';

interface ReportAProblemForm {
  arizaNo: string;
  problemDate: Date;
  km: string;
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

// GetUserReqNotifsForToday kaydı
interface TodayRequest extends RequestNotification {
  aracId?: number;
  lokasyonId?: number;
  lokasyon?: string;
  talepEdenId?: number;
  km?: number;
}

const PRIORITY_CODES = ['dusuk', 'orta', 'yuksek', 'acil'];
const SUCCESS_CODES = [200, 201, 202];

function ReportAProblem({ aracId = 0, talepEdenId = 0, onSuccess, mode = 'ariza', initialLocationId, initialLocationName }: ReportAProblemProps) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [loading, setLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(initialLocationId || 0);
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; fileName: string }[]>([]);
  // Ekran açılır açılmaz bugün bekleyen kayıt aranır ('checking'); varsa önce liste ('choose') gösterilir,
  // kullanıcı bir kaydı güncellemeyi ya da yeni kayıt eklemeyi seçer. Kayıt yoksa doğrudan boş form açılır.
  const [view, setView] = useState<'checking' | 'choose' | 'form'>('checking');
  const [pendingRecords, setPendingRecords] = useState<TodayRequest[]>([]);
  const [editing, setEditing] = useState<TodayRequest | null>(null);
  // Güncellemeye geçmeden önce yeni kayıt formunda girilenler (numaratörün verdiği numara ve fotoğraflar dahil)
  // saklanır; güncelleme iptal edilince form bu hâline döner ve numaratör boşuna yeni numara harcamaz.
  const newRecordDraft = useRef<{ values: ReportAProblemForm; photos: { uri: string; fileName: string }[] } | null>(null);

  const isTalepMode = mode === 'talep';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<ReportAProblemForm>({
    defaultValues: {
      arizaNo: '',
      problemDate: new Date(),
      km: '',
      oncelik: 'orta',
      talepTuru: '',
      lokasyon: initialLocationName || '',
      description: '',
    },
  });

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

  // Resimler sırayla yüklenir (paralel yükleme sunucuda aynı anda yazılan dosyaların bozulmasına yol açabiliyor)
  const uploadPhotos = async (recordId: number) => {
    for (const photo of selectedPhotos) {
      const ext = photo.fileName.split('.').pop() || 'jpg';
      await apiService.uploadPhoto({ uri: photo.uri, name: photo.fileName, type: getMimeTypeFromExtension(ext) }, recordId, 'TALEP_BILDIRIM', false);
    }
  };

  const uploadPhotosSafely = async (recordId: number) => {
    if (selectedPhotos.length === 0) return;
    try {
      await uploadPhotos(recordId);
    } catch (uploadError) {
      console.error('Photo upload error:', uploadError);
      Alert.alert(t('warning') || 'Uyarı', t('photoUploadError') || 'Talep kaydedildi ancak bazı resimler yüklenirken hata oluştu');
    }
  };

  // Görünüm (seçim / güncelleme) burada sıfırlanmaz: bottom sheet kapanınca içerik unmount olur ve bir sonraki
  // açılış temiz başlar. Form görünümüne dönmek numaratörü yeniden çağırıp boşuna bir talep numarası harcardı.
  const finish = (message: string) => {
    Alert.alert(t('success'), message);
    reset();
    setSelectedLocationId(0);
    setSelectedPhotos([]);
    onSuccess?.();
  };

  const createRecord = async (data: ReportAProblemForm) => {
    try {
      setLoading(true);
      const response = await apiService.addRequestItem({
        talepNo: data.arizaNo,
        aracId: aracId,
        lokasyonId: selectedLocationId,
        aciklama: data.description,
        tarih: dayjs(data.problemDate).format('YYYY-MM-DD'),
        talepDurum: 'beklemede',
        talepOncelik: data.oncelik,
        talepTur: isTalepMode ? data.talepTuru || 'ariza' : 'ariza',
        talepEdenId: talepEdenId,
        km: Number(data.km),
      });

      // Response formatı: { status: true, statusCode: 200, data: <kayıt id>, message: "..." }
      if (response?.status === true && response?.data) {
        await uploadPhotosSafely(Number(response.data));
      }

      finish(isTalepMode ? t('requestSubmittedSuccessfully') || 'Talep başarıyla oluşturuldu' : t('problemReportedSuccessfully') || 'Arıza başarıyla bildirildi');
    } catch (error: any) {
      console.error('Error reporting problem:', error);
      Alert.alert(t('error'), error.message || t('problemReportError') || 'Talep oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (record: TodayRequest, data: ReportAProblemForm) => {
    try {
      setLoading(true);
      const response = await apiService.updateRequestItem({
        siraNo: record.siraNo,
        talepNo: record.talepNo || data.arizaNo,
        aracId: record.aracId || aracId,
        lokasyonId: record.lokasyonId || selectedLocationId,
        aciklama: data.description,
        tarih: dayjs(data.problemDate).format('YYYY-MM-DD'),
        talepDurum: record.talepDurum || 'beklemede',
        talepOncelik: data.oncelik,
        talepTur: isTalepMode ? data.talepTuru || record.talepTur || '' : 'ariza',
        talepEdenId: record.talepEdenId || talepEdenId,
        km: Number(data.km),
      });
      if (response?.statusCode && !SUCCESS_CODES.includes(response.statusCode)) {
        throw new Error(response?.message || '');
      }

      await uploadPhotosSafely(record.siraNo);
      finish(t('recordUpdatedSuccessfully'));
    } catch (error: any) {
      console.error('Error updating request:', error);
      Alert.alert(t('error'), error.message || t('recordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcının bugün açtığı, durumu henüz değişmemiş ve bu ekranla aynı türdeki kayıtlar ekran açılınca bir kez
  // sorgulanır. Sorgu hata verirse kullanıcıyı bekletmemek için doğrudan yeni kayıt formu açılır.
  useEffect(() => {
    let active = true;

    const loadPendingToday = async () => {
      if (!talepEdenId) {
        setView('form');
        return;
      }
      try {
        const records: TodayRequest[] = await apiService.getUserRequestNotificationsForToday(talepEdenId);
        const pending = (Array.isArray(records) ? records : []).filter((record) => {
          const isFault = normalizeCode(record.talepTur) === 'ariza';
          const status = normalizeCode(record.talepDurum);
          const sameVehicle = !aracId || !record.aracId || record.aracId === aracId;
          return (isTalepMode ? !isFault : isFault) && (status === '' || status === 'beklemede') && sameVehicle;
        });
        if (!active) return;
        setPendingRecords(pending);
        setView(pending.length > 0 ? 'choose' : 'form');
      } catch (error) {
        console.error('Error fetching today requests:', error);
        if (active) setView('form');
      }
    };

    loadPendingToday();
    return () => {
      active = false;
    };
  }, [talepEdenId, aracId, isTalepMode]);

  const onSubmit = async (data: ReportAProblemForm) => {
    if (editing) {
      await updateRecord(editing, data);
    } else {
      await createRecord(data);
    }
  };

  // Seçilen eski kayıt aynı formda güncelleme moduna açılır.
  const startEditing = (record: TodayRequest) => {
    const priority = normalizeCode(record.talepOncelik);
    newRecordDraft.current = { values: getValues(), photos: selectedPhotos };
    setEditing(record);
    reset({
      arizaNo: record.talepNo || '',
      problemDate: record.tarih && dayjs(record.tarih).isValid() ? dayjs(record.tarih).toDate() : new Date(),
      km: record.km ? String(record.km) : '',
      oncelik: PRIORITY_CODES.includes(priority) ? priority : 'orta',
      talepTuru: isTalepMode ? normalizeCode(record.talepTur) : '',
      lokasyon: record.lokasyon || initialLocationName || '',
      description: record.aciklama || '',
    });
    setSelectedPhotos([]);
    setView('form');
  };

  const cancelEditing = () => {
    setEditing(null);
    if (newRecordDraft.current) {
      reset(newRecordDraft.current.values);
      setSelectedPhotos(newRecordDraft.current.photos);
    }
    setView('choose');
  };

  const isDarkMode = themeName === 'dark';
  const dateLabel = isTalepMode ? t('requestDate') || 'Talep Tarihi' : t('problemDate');
  const numberLabel = isTalepMode ? t('requestNumber') || 'Talep No' : t('faultNumber') || 'Arıza No';

  const title = isTalepMode ? t('talepBildir') || 'Talep Bildir' : t('reportAProblem');

  if (view === 'checking') {
    return (
      <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">
            {title}
          </Text>
          <YStack alignItems="center" gap="$3" paddingVertical="$6">
            <ActivityIndicator />
            <Text fontSize="$3" color="$midGray">
              {t('checkingTodayRecords')}
            </Text>
          </YStack>
        </YStack>
      </BottomSheetScrollView>
    );
  }

  if (view === 'choose') {
    return (
      <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">
            {title}
          </Text>

          <YStack gap="$2" backgroundColor={isDarkMode ? '#2C2C2E' : '#FFF7ED'} borderRadius="$4" padding="$3">
            <Text fontSize="$4" fontWeight="600">
              {isTalepMode ? t('pendingRequestsToday') : t('pendingFaultsToday')}
            </Text>
            <Text fontSize="$3" color="$midGray">
              {isTalepMode ? t('newOrUpdateRequestQuestion') : t('newOrUpdateFaultQuestion')}
            </Text>
          </YStack>

          <YStack>
            {pendingRecords.map((record) => (
              <Pressable key={record.siraNo} onPress={() => startEditing(record)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <RequestNotificationCard item={record} showType={isTalepMode} />
              </Pressable>
            ))}
          </YStack>

          <Button onPress={() => setView('form')} backgroundColor="$blue10" color="white" fontWeight="600" height={50} borderRadius="$2">
            {isTalepMode ? t('addNewRequest') : t('addNewFault')}
          </Button>
        </YStack>
      </BottomSheetScrollView>
    );
  }

  return (
    <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$6" fontWeight="bold">
          {editing ? (isTalepMode ? t('updateRequest') : t('updateFault')) : title}
        </Text>

        {editing ? (
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="600">
              {numberLabel}
            </Text>
            <Input value={editing.talepNo || ''} editable={false} opacity={0.7} borderColor="$borderColor" />
          </YStack>
        ) : (
          <NumaratorOnAdd
            control={control}
            name="arizaNo"
            label={numberLabel}
            placeholder={isTalepMode ? t('enterRequestNumber') || 'Talep numarası giriniz' : t('enterFaultNumber') || 'Arıza numarası giriniz'}
            error={errors.arizaNo?.message}
            moduleCode="TALEP_BILDIRIM"
            tableName="HasarTakibi"
            required
          />
        )}

        <DatePicker control={control} name="problemDate" label={dateLabel} placeholder={t('selectDate')} error={errors.problemDate?.message} required />

        <KmInput control={control} name="km" error={errors.km?.message} />

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
          {editing ? (loading ? t('updating') : t('update')) : loading ? t('submitting') : t('submit')}
        </Button>
        {editing ? (
          <Button chromeless onPress={cancelEditing} disabled={loading}>
            {t('cancel')}
          </Button>
        ) : pendingRecords.length > 0 ? (
          // Form değerleri bileşende kaldığı için listeye dönüp geri gelmek numaratörü yeniden çağırmaz.
          <Button chromeless onPress={() => setView('choose')} disabled={loading}>
            {t('backToList')}
          </Button>
        ) : null}
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
