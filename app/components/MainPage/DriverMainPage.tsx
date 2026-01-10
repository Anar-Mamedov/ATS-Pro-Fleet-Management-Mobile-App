import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/apiService';
import DocumentUpload from '../../../ui/components/DocumentUpload';
import { FormattedDate } from '../../../ui/components/FormattedDate';
import ResimUpload from '../../../ui/components/ResimUpload';
import ReportAProblem from './components/ReportAProblem';

export default function DriverMainPage() {
  const { t } = useTranslation();
  const bottomPad = useBottomBarPadding();
  const { themeName } = useThemeController();
  const [aracIds, setAracIds] = useState<number[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [maintenanceCardWidth, setMaintenanceCardWidth] = useState<number>(0);
  const [reminderData, setReminderData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userId, setUserId] = useState<number>(0);

  const firstVehicle = Array.isArray(vehicleData) && vehicleData.length > 0 ? vehicleData[selectedIndex] : null;

  const getUserInfo = useCallback(async () => {
    const id = await AsyncStorage.getItem('id');
    if (id) {
      setUserId(parseInt(id));
      const data = await apiService.getUserInfoById(id);
      setAracIds(Array.isArray(data?.aracIds) ? data.aracIds : []);
    }
  }, []);

  const getDriverDashboardCardSection = useCallback(async () => {
    const data = await apiService.getDriverDashboardCardSection(aracIds);
    setVehicleData(data);
  }, [aracIds]);

  const getDashboardReminder = useCallback(async () => {
    const data = await apiService.getDashboardReminder(firstVehicle?.aracId);
    setReminderData(data);
  }, [firstVehicle?.aracId]);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  useEffect(() => {
    if (aracIds.length > 0) {
      getDriverDashboardCardSection();
    }
  }, [aracIds, getDriverDashboardCardSection]);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['30%', '50%'], []);
  const faultSnapPoints = useMemo(() => ['75%'], []);
  const openSheet = () => bottomSheetModalRef.current?.present();
  const closeSheet = () => bottomSheetModalRef.current?.dismiss();

  // Separate sheets for Araç Belgeleri and Araç Fotoğrafları
  const faultSheetRef = useRef<BottomSheetModal>(null);
  const requestSheetRef = useRef<BottomSheetModal>(null);
  const docsSheetRef = useRef<BottomSheetModal>(null);
  const photosSheetRef = useRef<BottomSheetModal>(null);
  const kmUpdateSheetRef = useRef<BottomSheetModal>(null);
  const openFaultSheet = () => faultSheetRef.current?.present();
  const closeFaultSheet = () => faultSheetRef.current?.dismiss();
  const openRequestSheet = () => requestSheetRef.current?.present();
  const closeRequestSheet = () => requestSheetRef.current?.dismiss();
  const openDocsSheet = () => docsSheetRef.current?.present();
  const openPhotosSheet = () => photosSheetRef.current?.present();
  const openKmUpdateSheet = () => kmUpdateSheetRef.current?.present();
  const closeKmUpdateSheet = () => kmUpdateSheetRef.current?.dismiss();

  useEffect(() => {
    if (firstVehicle) {
      getDashboardReminder();
    }
  }, [firstVehicle, getDashboardReminder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getUserInfo();
      await Promise.all([getDriverDashboardCardSection(), getDashboardReminder()]);
    } finally {
      setRefreshing(false);
    }
  }, [getUserInfo, getDriverDashboardCardSection, getDashboardReminder]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#111111' : 'hsl(0, 0%, 94.1%)' }} edges={['top', 'left', 'right']}>
      <Stack flex={1} backgroundColor="$background">
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} nestedScrollEnabled refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Pressable onPress={openSheet} style={{ alignSelf: 'flex-start' }}>
            <YStack justifyContent="flex-start" alignItems="flex-start" padding="$4" gap="$2" alignSelf="flex-start">
              {firstVehicle && (
                <>
                  <Text fontSize="$8" fontWeight="bold" color="$color">
                    {firstVehicle.plaka}
                  </Text>
                  <XStack alignItems="center" space="$1">
                    <Text fontSize="$5" color="$color" opacity={0.8} numberOfLines={1} ellipsizeMode="tail" maxWidth={100}>
                      {firstVehicle.model}
                    </Text>
                    <Text fontSize="$5" color="$color" opacity={0.8}>
                      |
                    </Text>
                    <Text fontSize="$5" color={firstVehicle.aktif ? '$green10' : '$red10'}>
                      {firstVehicle.aktif ? t('active') : t('passive')}
                    </Text>
                  </XStack>
                </>
              )}
            </YStack>
          </Pressable>

          <YStack justifyContent="flex-start" alignItems="flex-start" padding="$4" gap="$3">
            <YStack width="100%" backgroundColor="$color1" borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$3" gap="$3">
              <XStack gap="$3">
                <Pressable onPress={openKmUpdateSheet} style={{ flex: 1 }}>
                  <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$3" padding="$2" gap="$2">
                    <XStack alignItems="center" space="$3">
                      <MaterialIcons name="speed" size={24} color="#007AFF" />
                      <YStack flex={1}>
                        <Text fontSize="$5" fontWeight="600" color="$color" numberOfLines={1} ellipsizeMode="tail">
                          {firstVehicle?.guncelKm} km
                        </Text>
                        <Text color="$color" opacity={0.7} numberOfLines={1}>
                          {t('guncelKm')}
                        </Text>
                      </YStack>
                    </XStack>
                  </YStack>
                </Pressable>
                <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$3" padding="$2">
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    // ScrollView genişliği kolona eşitlensin
                    style={{ width: '100%' }}
                    // Genişliği doğrudan ScrollView'dan ölç
                    onLayout={(e) => setMaintenanceCardWidth(e.nativeEvent.layout.width)}
                  >
                    <XStack alignItems="center" space="$3" style={{ width: maintenanceCardWidth || 1 }}>
                      <MaterialIcons name="build" size={24} color="#007AFF" />
                      <YStack flex={1}>
                        <Text fontSize="$5" fontWeight="600" color="$color" numberOfLines={1} ellipsizeMode="tail">
                          {firstVehicle?.hedefKm} km
                        </Text>
                        <Text color="$color" opacity={0.7} numberOfLines={1}>
                          {t('bakimKm')}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack alignItems="center" space="$3" style={{ width: maintenanceCardWidth || 1 }}>
                      <MaterialIcons name="event" size={24} color="#007AFF" />
                      <YStack flex={1}>
                        <FormattedDate
                          value={firstVehicle?.hedefTarih ?? ''}
                          format="L"
                          textProps={{ fontSize: '$5', fontWeight: '600', numberOfLines: 1, ellipsizeMode: 'tail' }}
                        />
                        <Text color="$color" opacity={0.7} numberOfLines={1}>
                          {t('bakimZamani')}
                        </Text>
                      </YStack>
                    </XStack>
                  </ScrollView>
                </YStack>
              </XStack>
              <XStack gap="$3">
                <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$2" gap="$2">
                  <XStack alignItems="center" space="$3">
                    <MaterialIcons name="policy" size={24} color="#007AFF" />
                    <YStack flex={1}>
                      <Text fontSize="$5" fontWeight="600" color="$color" numberOfLines={1} ellipsizeMode="tail">
                        <FormattedDate value={firstVehicle?.sonSigortaTarih ?? ''} format="L" textProps={{ fontSize: '$5', fontWeight: '600' }} />
                      </Text>
                      <Text color="$color" opacity={0.7} numberOfLines={1}>
                        {t('sigortaBitis')}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
                <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$2" gap="$2">
                  <XStack alignItems="center" space="$3">
                    <MaterialIcons name="local-gas-station" size={24} color="#007AFF" />
                    <YStack flex={1}>
                      <XStack flexShrink={1}>
                        <Text fontSize="$5" fontWeight="600" color="$color" numberOfLines={1} ellipsizeMode="tail" flexShrink={1}>
                          {firstVehicle?.ortalamaTuketim}
                        </Text>
                      </XStack>
                      <Text color="$color" opacity={0.7} numberOfLines={1}>
                        {t('fuelConsumptionUnit')}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
              </XStack>
            </YStack>
          </YStack>

          <XStack padding="$4" gap="$3" width="100%" flexWrap="wrap">
            {/* <Button
              backgroundColor="$blue10"
              flexBasis="48%"
              onPress={() => {}}
              pressTheme={false}
              hoverTheme={false}
              pressStyle={{ backgroundColor: '$blue10', opacity: 0.85 }}
              icon={<MaterialIcons name="gavel" size={20} color="white" />}
            >
              <Button.Text color="white" fontSize="$5">
                {t('cezaGirisi')}
              </Button.Text>
            </Button>
            <Button
              backgroundColor="$green10"
              flexBasis="48%"
              onPress={() => {}}
              pressTheme={false}
              hoverTheme={false}
              pressStyle={{ backgroundColor: '$green10', opacity: 0.85 }}
              icon={<MaterialIcons name="local-gas-station" size={20} color="white" />}
            >
              <Button.Text color="white" fontSize="$5">
                {t('yakitGirisi')}
              </Button.Text>
            </Button> */}
            <Button
              backgroundColor="$red10"
              flexBasis="48%"
              onPress={openFaultSheet}
              pressTheme={false}
              hoverTheme={false}
              pressStyle={{ backgroundColor: '$red10', opacity: 0.85 }}
              icon={<MaterialIcons name="report-problem" size={20} color="white" />}
            >
              <Button.Text color="white" fontSize="$5">
                {t('arizaBildir')}
              </Button.Text>
            </Button>
            <Button
              backgroundColor="$yellow10"
              flexBasis="48%"
              onPress={openRequestSheet}
              pressTheme={false}
              hoverTheme={false}
              pressStyle={{ backgroundColor: '$yellow10', opacity: 0.85 }}
              icon={<MaterialIcons name="contact-support" size={20} color="white" />}
            >
              <Button.Text color="white" fontSize="$5">
                {t('talepBildir')}
              </Button.Text>
            </Button>
            <Button
              backgroundColor="$purple10"
              flexBasis="48%"
              onPress={openDocsSheet}
              pressTheme={false}
              hoverTheme={false}
              pressStyle={{ backgroundColor: '$purple10', opacity: 0.85 }}
              icon={<MaterialIcons name="description" size={20} color="white" />}
            >
              <Button.Text color="white" fontSize="$5">
                {t('aracBelgeleri')}
              </Button.Text>
            </Button>
            <Button
              backgroundColor="$orange10"
              flexBasis="48%"
              onPress={openPhotosSheet}
              pressTheme={false}
              hoverTheme={false}
              pressStyle={{ backgroundColor: '$orange10', opacity: 0.85 }}
              icon={<MaterialIcons name="photo-library" size={20} color="white" />}
            >
              <Button.Text color="white" fontSize="$5">
                {t('aracFotograflari')}
              </Button.Text>
            </Button>
          </XStack>

          {Array.isArray(reminderData) && (
            <YStack padding="$4" gap="$2">
              <YStack backgroundColor="$color1" borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$3" gap="$3">
                <Text fontSize="$6" fontWeight="700" color="$color">
                  {t('tasks')}
                </Text>
                <YStack gap="$2">
                  {(reminderData as { category: string; count: number }[])
                    .filter((i) => i.count > 0)
                    .map((item) => {
                      const iconMap: Record<string, { icon: any; color: string; subtitleKey?: string; rightText?: string }> = {
                        vergi: { icon: 'request-quote', color: '#F59E0B' },
                        egzoz: { icon: 'science', color: '#6B7280' },
                        sigorta: { icon: 'policy', color: '#2563EB' },
                        muayene: { icon: 'assignment', color: '#22C55E' },
                        sozlesme: { icon: 'description', color: '#A855F7' },
                        ceza: { icon: 'gavel', color: '#EF4444' },
                        kiralama: { icon: 'directions-car', color: '#14B8A6' },
                        tasitKarti: { icon: 'credit-card', color: '#0EA5E9' },
                        periyodikBakim: { icon: 'event', color: '#F59E0B' },
                      };
                      const cfg = iconMap[item.category] || { icon: 'notifications', color: '#6B7280' };
                      const label = t(`${item.category}`);
                      const subtitle = cfg.subtitleKey ? t(cfg.subtitleKey) : undefined;
                      return (
                        <Pressable key={item.category} style={{ width: '100%' }}>
                          <XStack
                            alignItems="center"
                            justifyContent="space-between"
                            borderWidth={1}
                            borderColor="$gray4"
                            borderRadius="$3"
                            padding="$3"
                            backgroundColor="$backgroundStrong"
                          >
                            <XStack alignItems="center" gap="$3">
                              <Stack width={28} height={28} borderRadius={6} alignItems="center" justifyContent="center">
                                <MaterialIcons name={cfg.icon} size={18} color={cfg.color} />
                              </Stack>
                              <YStack gap="$1">
                                <Text fontSize="$5" fontWeight="600" color="$color">{`${item.count} ${label}`}</Text>
                                {subtitle && (
                                  <Text color="$color" opacity={0.7}>
                                    {subtitle}
                                  </Text>
                                )}
                              </YStack>
                            </XStack>
                            <XStack alignItems="center" gap="$1">
                              {cfg.rightText && <Text color="$gray11">{cfg.rightText}</Text>}
                              <MaterialIcons name="chevron-right" size={20} color="#9BA1A6" />
                            </XStack>
                          </XStack>
                        </Pressable>
                      );
                    })}
                </YStack>
              </YStack>
            </YStack>
          )}
        </ScrollView>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose
          handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
          backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
        >
          <BottomSheetView style={{ flex: 1, paddingTop: 20 }}>
            <YStack space="$1">
              <Text fontSize="$6" fontWeight="600" textAlign="center" marginBottom="$4" color="$color">
                {t('araclar')}
              </Text>
              <BottomSheetFlatList
                data={Array.isArray(vehicleData) ? vehicleData : []}
                keyExtractor={(item: any) => String(item.aracId)}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                ItemSeparatorComponent={() => <YStack height={1} backgroundColor="$gray4" />}
                renderItem={({ item, index }: { item: any; index: number }) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <Pressable
                      onPress={() => {
                        setSelectedIndex(index);
                        closeSheet();
                      }}
                      style={{ width: '100%' }}
                    >
                      <YStack
                        paddingVertical="$3"
                        paddingHorizontal="$3"
                        gap="$1"
                        backgroundColor={isSelected ? '$blue2' : 'transparent'}
                        borderRadius="$3"
                        borderWidth={isSelected ? 1 : 0}
                        borderColor={isSelected ? '$blue10' : 'transparent'}
                        position="relative"
                      >
                        <XStack alignItems="center" justifyContent="space-between">
                          <Text fontSize="$6" fontWeight="600" color="$color">
                            {item.plaka} <Text color={item.aktif ? '$green10' : '$red10'}>{item.aktif ? `(${t('active')})` : `(${t('passive')})`}</Text>
                          </Text>
                        </XStack>
                        <Text fontSize="$4" color="$gray11">
                          {item.marka} | {item.model}
                        </Text>
                        {isSelected && (
                          <Stack position="absolute" right="$3" top={0} bottom={0} justifyContent="center" alignItems="center">
                            <Text fontSize="$4" color="$blue10">
                              ✓
                            </Text>
                          </Stack>
                        )}
                      </YStack>
                    </Pressable>
                  );
                }}
              />
            </YStack>
          </BottomSheetView>
        </BottomSheetModal>

        {/* Arıza Bildir Bottom Sheet */}
        <BottomSheetModal
          ref={faultSheetRef}
          index={0}
          snapPoints={faultSnapPoints}
          enablePanDownToClose
          enableDynamicSizing={false}
          topInset={46}
          handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
          backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
        >
          <ReportAProblem
            aracId={firstVehicle?.aracId || 0}
            talepEdenId={userId}
            onSuccess={closeFaultSheet}
            mode="ariza"
            initialLocationId={firstVehicle?.lokasyonId}
            initialLocationName={firstVehicle?.lokasyon}
          />
        </BottomSheetModal>

        {/* Talep Bildir Bottom Sheet */}
        <BottomSheetModal
          ref={requestSheetRef}
          index={0}
          snapPoints={faultSnapPoints}
          enablePanDownToClose
          enableDynamicSizing={false}
          topInset={46}
          handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
          backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
        >
          <ReportAProblem
            aracId={firstVehicle?.aracId || 0}
            talepEdenId={userId}
            onSuccess={closeRequestSheet}
            mode="talep"
            initialLocationId={firstVehicle?.lokasyonId}
            initialLocationName={firstVehicle?.lokasyon}
          />
        </BottomSheetModal>

        {/* Araç Belgeleri Bottom Sheet */}
        <BottomSheetModal
          ref={docsSheetRef}
          index={0}
          snapPoints={faultSnapPoints}
          enablePanDownToClose
          enableDynamicSizing={false}
          topInset={46}
          handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
          backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
        >
          <BottomSheetView style={{ flex: 1 }}>
            {firstVehicle ? (
              <DocumentUpload refId={firstVehicle.aracId} refGroup="ARAC" editable={true} />
            ) : (
              <YStack padding="$4" alignItems="center">
                <Text color="$color" opacity={0.7} textAlign="center">
                  {t('pleaseSelectVehicle')}
                </Text>
              </YStack>
            )}
          </BottomSheetView>
        </BottomSheetModal>

        {/* Araç Fotoğrafları Bottom Sheet */}
        <BottomSheetModal
          ref={photosSheetRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose
          handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
          backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
        >
          <BottomSheetView style={{ flex: 1, paddingTop: 20 }}>
            <YStack space="$3" paddingHorizontal="$4">
              <Text fontSize="$6" fontWeight="600" textAlign="center" marginBottom="$2" color="$color">
                {t('aracFotograflari')}
              </Text>
              {firstVehicle ? (
                <ResimUpload refId={firstVehicle.aracId} refGroup="ARAC" isForDefault={false} />
              ) : (
                <Text color="$color" opacity={0.7} textAlign="center">
                  {t('pleaseSelectVehicle')}
                </Text>
              )}
            </YStack>
          </BottomSheetView>
        </BottomSheetModal>

        {/* Kilometre Güncelleme Bottom Sheet */}
        <KmUpdateBottomSheet
          sheetRef={kmUpdateSheetRef}
          themeName={themeName}
          firstVehicle={firstVehicle}
          userId={userId}
          onSuccess={() => {
            closeKmUpdateSheet();
            getDriverDashboardCardSection();
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}

// Km Update Bottom Sheet Component
function KmUpdateBottomSheet({
  sheetRef,
  themeName,
  firstVehicle,
  userId,
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  themeName: string;
  firstVehicle: any;
  userId: number;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      yeniKm: '',
    },
  });

  useEffect(() => {
    if (firstVehicle?.guncelKm) {
      reset({ yeniKm: String(firstVehicle.guncelKm) });
    }
  }, [firstVehicle?.guncelKm, reset]);

  const onSubmit = async (data: { yeniKm: string }) => {
    const yeniKm = parseFloat(data.yeniKm);
    const eskiKm = firstVehicle?.guncelKm || 0;

    if (yeniKm < eskiKm) {
      Alert.alert(t('error'), t('kmCannotBeLessThanCurrent'));
      return;
    }

    try {
      const now = dayjs();
      const kmLogData = {
        kmAracId: firstVehicle?.aracId,
        tarih: now.format(),
        saat: now.format('HH:mm'),
        eskiKm,
        yeniKm,
        kaynak: 'GÜNCELLEME',
        lokasyonId: firstVehicle?.lokasyonId || 0,
        surucuId: userId,
      };

      console.log('Sending km log data:', JSON.stringify(kmLogData, null, 2));

      await apiService.addKmLog(kmLogData);

      Alert.alert(t('success'), t('kmUpdatedSuccessfully'));
      onSuccess();
    } catch (error: any) {
      console.error('Km update error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert(t('error'), error.response?.data?.message || t('kmUpdateFailed'));
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['33%', '90%']}
      index={0}
      enablePanDownToClose
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
      backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
      backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <YStack gap="$4" paddingTop="$2">
          <Text fontSize="$6" fontWeight="600" textAlign="center" color="$color">
            {t('updateKm')}
          </Text>

          <YStack gap="$2">
            <Text fontSize="$4" color="$color" opacity={0.7}>
              {t('currentKm')}: {firstVehicle?.guncelKm} km
            </Text>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color">
                {t('newKm')}
              </Text>
              <Controller
                control={control}
                name="yeniKm"
                rules={{
                  required: t('required'),
                  validate: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num)) return t('invalidNumber');
                    if (num < (firstVehicle?.guncelKm || 0)) return t('kmCannotBeLessThanCurrent');
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <BottomSheetTextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    placeholder={t('enterNewKm')}
                    style={{
                      backgroundColor: themeName === 'dark' ? '#2C2C2E' : '#F2F2F7',
                      borderWidth: 1,
                      borderColor: errors.yeniKm ? '#FF3B30' : themeName === 'dark' ? '#3A3A3C' : '#C6C6C8',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: themeName === 'dark' ? '#FFFFFF' : '#000000',
                    }}
                  />
                )}
              />
              {errors.yeniKm && (
                <Text fontSize="$3" color="$red10">
                  {errors.yeniKm.message}
                </Text>
              )}
            </YStack>
          </YStack>

          <Button
            backgroundColor="$blue10"
            onPress={handleSubmit(onSubmit)}
            pressTheme={false}
            hoverTheme={false}
            pressStyle={{ backgroundColor: '$blue10', opacity: 0.85 }}
            marginBottom={20}
          >
            <Button.Text color="white" fontSize="$5">
              {t('apply')}
            </Button.Text>
          </Button>
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
