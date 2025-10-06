import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/apiService';
import { FormattedDate } from '../../../ui/components/FormattedDate';
import ResimUpload from '../../../ui/components/ResimUpload';

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

  const firstVehicle = Array.isArray(vehicleData) && vehicleData.length > 0 ? vehicleData[selectedIndex] : null;

  const getUserInfo = useCallback(async () => {
    const id = await AsyncStorage.getItem('id');
    if (id) {
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
  const openSheet = () => bottomSheetModalRef.current?.present();
  const closeSheet = () => bottomSheetModalRef.current?.dismiss();

  // Separate sheets for Araç Belgeleri and Araç Fotoğrafları
  const docsSheetRef = useRef<BottomSheetModal>(null);
  const photosSheetRef = useRef<BottomSheetModal>(null);
  const openDocsSheet = () => docsSheetRef.current?.present();
  const closeDocsSheet = () => docsSheetRef.current?.dismiss();
  const openPhotosSheet = () => photosSheetRef.current?.present();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#111111' : 'hsl(0, 0%, 94.1%)' }} edges={['top', 'left', 'right', 'bottom']}>
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
                <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$3" padding="$2" gap="$2">
                  <XStack alignItems="center" space="$3">
                    <MaterialIcons name="speed" size={24} color="#007AFF" />
                    <YStack>
                      <Text fontSize="$5" fontWeight="600" color="$color">
                        {firstVehicle?.guncelKm} km
                      </Text>
                      <Text color="$color" opacity={0.7}>
                        {t('guncelKm')}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
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
                      <YStack>
                        <Text fontSize="$5" fontWeight="600" color="$color">
                          {firstVehicle?.hedefKm} km
                        </Text>
                        <Text color="$color" opacity={0.7}>
                          {t('bakimZamani')}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack alignItems="center" space="$3" style={{ width: maintenanceCardWidth || 1 }}>
                      <MaterialIcons name="event" size={24} color="#007AFF" />
                      <YStack>
                        <FormattedDate value={firstVehicle?.hedefTarih ?? ''} format="L" textProps={{ fontSize: '$5', fontWeight: '600' }} />
                        <Text color="$color" opacity={0.7}>
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
                    <YStack>
                      <Text fontSize="$5" fontWeight="600" color="$color">
                        <FormattedDate value={firstVehicle?.sonSigortaTarih ?? ''} format="L" textProps={{ fontSize: '$5', fontWeight: '600' }} />
                      </Text>
                      <Text color="$color" opacity={0.7}>
                        {t('sigortaBitis')}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
                <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$2" gap="$2">
                  <XStack alignItems="center" space="$3">
                    <MaterialIcons name="local-gas-station" size={24} color="#007AFF" />
                    <YStack>
                      <XStack>
                        <Text fontSize="$5" fontWeight="600" color="$color" numberOfLines={1} ellipsizeMode="tail" maxWidth={60}>
                          {firstVehicle?.ortalamaTuketim}
                        </Text>
                        <Text fontSize="$5" color="$color" opacity={0.7}>
                          {t('fuelConsumptionUnit')}
                        </Text>
                      </XStack>
                      <Text color="$color" opacity={0.7}>
                        {t('yakitTuketimi')}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
              </XStack>
            </YStack>
          </YStack>

          <XStack padding="$4" gap="$3" width="100%" flexWrap="wrap">
            <Button
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
            </Button>
            <Button
              backgroundColor="$red10"
              flexBasis="48%"
              onPress={() => {}}
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
              onPress={() => {}}
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

        {/* Araç Belgeleri Bottom Sheet */}
        <BottomSheetModal
          ref={docsSheetRef}
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
                {t('aracBelgeleri')}
              </Text>
              <Text color="$color" opacity={0.7} textAlign="center">
                Şimdilik içerik yok.
              </Text>
              <Button alignSelf="center" onPress={closeDocsSheet} pressTheme={false} hoverTheme={false}>
                <Button.Text>{t('close') ?? 'Kapat'}</Button.Text>
              </Button>
            </YStack>
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
                  Lütfen bir araç seçin.
                </Text>
              )}
            </YStack>
          </BottomSheetView>
        </BottomSheetModal>
      </Stack>
    </SafeAreaView>
  );
}
