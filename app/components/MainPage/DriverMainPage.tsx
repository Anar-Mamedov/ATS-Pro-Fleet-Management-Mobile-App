import { useThemeController } from '@/config/theme';
import { useVehicleContext } from '@/context/VehicleContext';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text, useTheme, getVariable } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { LayoutChangeEvent } from 'react-native';
import { Alert, Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/apiService';
import DocumentUpload from '../../../ui/components/DocumentUpload';
import { FormattedDate } from '../../../ui/components/FormattedDate';
import ResimUpload from '../../../ui/components/ResimUpload';
import FuelListBottomSheet from './components/FuelListBottomSheet';
import ReportAProblem from './components/ReportAProblem';
import { Gauge, Wrench, ShieldCheck, Fuel, CalendarCheck, Droplet, TriangleAlert, MapPin, FileText, Camera, ChevronRight, Calendar } from '@tamagui/lucide-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

export default function DriverMainPage() {
  const { t } = useTranslation();
  const bottomPad = useBottomBarPadding();
  const { themeName } = useThemeController();
  const theme = useTheme();
  const isDark = themeName === 'dark';

  const [aracIds, setAracIds] = useState<number[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [reminderData, setReminderData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userId, setUserId] = useState<number>(0);
  const [fuelReloadToken, setFuelReloadToken] = useState<number>(0);

  // Slider card states
  const [maintenanceCardWidth, setMaintenanceCardWidth] = useState<number>(0);
  const [insuranceCardWidth, setInsuranceCardWidth] = useState<number>(0);
  const [inspectionCardWidth, setInspectionCardWidth] = useState<number>(0);

  // Slider ScrollView refs
  const maintenanceScrollRef = useRef<ScrollView>(null);
  const insuranceScrollRef = useRef<ScrollView>(null);
  const inspectionScrollRef = useRef<ScrollView>(null);

  const { setSelectedVehicleId } = useVehicleContext();

  const firstVehicle = Array.isArray(vehicleData) && vehicleData.length > 0 ? vehicleData[selectedIndex] : null;

  useEffect(() => {
    if (firstVehicle?.aracId) {
      setSelectedVehicleId(firstVehicle.aracId);
    } else {
      setSelectedVehicleId(null);
    }
  }, [firstVehicle, setSelectedVehicleId]);

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

  useEffect(() => {
    if (firstVehicle) {
      getDashboardReminder();
    }
  }, [firstVehicle, getDashboardReminder]);

  // Inspection items for slider (muayene, egzoz, sozlesme, vergi, takograf)
  const inspectionItems = useMemo(
    () => [
      { key: 'muayene', label: t('muayene'), value: firstVehicle?.muayeneTarih },
      { key: 'egzoz', label: t('egzoz'), value: firstVehicle?.egzosTarih },
      { key: 'sozlesme', label: t('sozlesme'), value: firstVehicle?.sozlesmeTarih },
      { key: 'vergi', label: t('vergi'), value: firstVehicle?.vergiTarih },
      { key: 'takograf', label: t('takograf'), value: firstVehicle?.takografTarih },
    ],
    [firstVehicle, t]
  );

  // Insurance items for slider
  const insuranceItems = useMemo((): { sigorta: string; bitisTarih: string | null; siraNo?: number }[] => {
    if (Array.isArray(firstVehicle?.sigortalar) && firstVehicle.sigortalar.length > 0) {
      return firstVehicle.sigortalar;
    }
    return [{ sigorta: t('sigorta'), bitisTarih: null }];
  }, [firstVehicle, t]);

  // Slider scroll handlers
  const handleMaintenanceLayout = useCallback((event: LayoutChangeEvent) => {
    setMaintenanceCardWidth(event.nativeEvent.layout.width);
  }, []);

  const handleInsuranceLayout = useCallback((event: LayoutChangeEvent) => {
    setInsuranceCardWidth(event.nativeEvent.layout.width);
  }, []);

  const handleInspectionLayout = useCallback((event: LayoutChangeEvent) => {
    setInspectionCardWidth(event.nativeEvent.layout.width);
  }, []);


  // Bottom Sheet refs
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const faultSheetRef = useRef<BottomSheetModal>(null);
  const requestSheetRef = useRef<BottomSheetModal>(null);
  const docsSheetRef = useRef<BottomSheetModal>(null);
  const photosSheetRef = useRef<BottomSheetModal>(null);
  const kmUpdateSheetRef = useRef<BottomSheetModal>(null);
  const fuelSheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['30%', '50%'], []);
  const faultSnapPoints = useMemo(() => ['75%'], []);

  const openSheet = () => bottomSheetModalRef.current?.present();
  const closeSheet = () => bottomSheetModalRef.current?.dismiss();
  const openFaultSheet = () => faultSheetRef.current?.present();
  const closeFaultSheet = () => faultSheetRef.current?.dismiss();
  const openRequestSheet = () => requestSheetRef.current?.present();
  const closeRequestSheet = () => requestSheetRef.current?.dismiss();
  const openDocsSheet = () => docsSheetRef.current?.present();
  const openPhotosSheet = () => photosSheetRef.current?.present();
  const openKmUpdateSheet = () => kmUpdateSheetRef.current?.present();
  const closeKmUpdateSheet = () => kmUpdateSheetRef.current?.dismiss();

  const openFuelSheet = useCallback(() => {
    if (!firstVehicle?.aracId) {
      Alert.alert(t('error'), t('pleaseSelectVehicle'));
      return;
    }
    setFuelReloadToken((prev) => prev + 1);
    fuelSheetRef.current?.present();
  }, [firstVehicle?.aracId, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getUserInfo();
      await Promise.all([getDriverDashboardCardSection(), getDashboardReminder()]);
    } finally {
      setRefreshing(false);
    }
  }, [getUserInfo, getDriverDashboardCardSection, getDashboardReminder]);

  // Fuel limit display
  const fuelLimitValue = firstVehicle?.yakitLimiti;
  const fuelLimitDisplay = fuelLimitValue === null || fuelLimitValue === undefined ? '-' : String(fuelLimitValue);

  // Colors from Tamagui theme config using standard keys
  const colors = {
    bgPage: getVariable(theme.background),
    bgCard: getVariable(theme.backgroundStrong),
    bgElevated: getVariable(theme.backgroundElevated),
    textPrimary: getVariable(theme.color),
    textSecondary: getVariable(theme.placeholderColor),
    textTertiary: getVariable(theme.placeholderColor),
    borderLight: getVariable(theme.borderColor),
    bluePrimary: getVariable(theme.accentBackground),
    blueTint: `${getVariable(theme.accentBackground)}14`,
    greenSuccess: getVariable(theme.success),
    redError: getVariable(theme.error),
    amberWarning: getVariable(theme.warning),
    purple: getVariable(theme.purple),
    orange: getVariable(theme.orange),
  };

  // Reminder icon mapping
  const getReminderIcon = (category: string) => {
    const iconMap: Record<string, { icon: any; color: string }> = {
      vergi: { icon: FileText, color: colors.amberWarning },
      egzoz: { icon: FileText, color: colors.textSecondary },
      sigorta: { icon: ShieldCheck, color: colors.bluePrimary },
      muayene: { icon: CalendarCheck, color: colors.greenSuccess },
      sozlesme: { icon: FileText, color: colors.purple },
      ceza: { icon: TriangleAlert, color: colors.redError },
      kiralama: { icon: FileText, color: '#14B8A6' },
      tasitKarti: { icon: FileText, color: '#0EA5E9' },
      periyodikBakim: { icon: CalendarCheck, color: colors.amberWarning },
    };
    return iconMap[category] || { icon: FileText, color: colors.textSecondary };
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPage }]} edges={['top', 'left', 'right']}>
      <Stack flex={1} backgroundColor={colors.bgPage}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 20 }}
          nestedScrollEnabled
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header Section */}
          <Pressable onPress={openSheet}>
            <YStack gap={4} marginTop={16}>
              {firstVehicle && (
                <>
                  <Text style={[styles.plateNumber, { color: colors.textPrimary }]}>{firstVehicle.plaka}</Text>
                  <XStack alignItems="center" gap={8}>
                    <Text style={[styles.vehicleModel, { color: colors.textSecondary }]} numberOfLines={1}>
                      {firstVehicle.model}
                    </Text>
                    <Stack width={1} height={16} backgroundColor={colors.borderLight} />
                    <Stack backgroundColor="#10B98114" paddingHorizontal={10} paddingVertical={4} borderRadius={6}>
                      <Text style={{ color: colors.greenSuccess, fontSize: 12, fontWeight: '600' }}>
                        {firstVehicle.aktif ? t('active') : t('passive')}
                      </Text>
                    </Stack>
                  </XStack>
                </>
              )}
            </YStack>
          </Pressable>

          {/* Info Grid - 6 Cards (2x3) */}
          <YStack gap={12} marginTop={24}>
            {/* Row 1 */}
            <XStack gap={12}>
              <Pressable style={{ width: CARD_WIDTH }} onPress={openKmUpdateSheet}>
                <Stack style={[styles.infoCard, { backgroundColor: colors.bgCard }]}>
                  <XStack alignItems="center" gap={12}>
                    <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                      <Gauge size={20} color={colors.bluePrimary} />
                    </Stack>
                    <YStack gap={2} flex={1}>
                      <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{firstVehicle?.guncelKm ?? '-'} km</Text>
                      <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('guncelKm')}</Text>
                    </YStack>
                  </XStack>
                </Stack>
              </Pressable>
              <Stack style={[styles.infoCard, { backgroundColor: colors.bgCard, width: CARD_WIDTH, padding: 0, overflow: 'hidden' }]}>
                <ScrollView
                  ref={maintenanceScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  style={{ width: '100%' }}
                  onLayout={handleMaintenanceLayout}
                >
                  {/* Bakım Km */}
                  <View style={[styles.sliderPage, { width: maintenanceCardWidth || CARD_WIDTH }]}>
                    <XStack alignItems="center" gap={12}>
                      <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                        <Wrench size={20} color={colors.bluePrimary} />
                      </Stack>
                      <YStack gap={2} flex={1}>
                        <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{firstVehicle?.hedefKm ?? '-'} km</Text>
                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('bakimKm')}</Text>
                      </YStack>
                    </XStack>
                  </View>
                  {/* Bakım Tarihi */}
                  <View style={[styles.sliderPage, { width: maintenanceCardWidth || CARD_WIDTH }]}>
                    <XStack alignItems="center" gap={12}>
                      <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                        <Calendar size={20} color={colors.bluePrimary} />
                      </Stack>
                      <YStack gap={2} flex={1}>
                        {firstVehicle?.hedefTarih ? (
                          <FormattedDate value={firstVehicle.hedefTarih} format="L" textProps={{ style: [styles.cardValue, { color: colors.textPrimary }] }} />
                        ) : (
                          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>-</Text>
                        )}
                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('bakimZamani')}</Text>
                      </YStack>
                    </XStack>
                  </View>
                </ScrollView>
              </Stack>
            </XStack>

            {/* Row 2 */}
            <XStack gap={12}>
              <Pressable style={{ width: CARD_WIDTH }} onPress={openFuelSheet}>
                <Stack style={[styles.infoCard, { backgroundColor: colors.bgCard }]}>
                  <XStack alignItems="center" gap={12}>
                    <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                      <Droplet size={20} color={colors.bluePrimary} />
                    </Stack>
                    <YStack gap={2} flex={1}>
                      <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{fuelLimitDisplay}</Text>
                      <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('yakitLimiti')}</Text>
                    </YStack>
                  </XStack>
                </Stack>
              </Pressable>
              <Stack style={[styles.infoCard, { backgroundColor: colors.bgCard, width: CARD_WIDTH }]}>
                <XStack alignItems="center" gap={12}>
                  <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                    <Fuel size={20} color={colors.bluePrimary} />
                  </Stack>
                  <YStack gap={2} flex={1}>
                    <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{firstVehicle?.ortalamaTuketim ?? '-'}</Text>
                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('fuelConsumptionUnit')}</Text>
                  </YStack>
                </XStack>
              </Stack>
            </XStack>

            {/* Row 3 */}
            <XStack gap={12}>
              <Stack style={[styles.infoCard, { backgroundColor: colors.bgCard, width: CARD_WIDTH, padding: 0, overflow: 'hidden' }]}>
                <ScrollView
                  ref={inspectionScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  style={{ width: '100%' }}
                  onLayout={handleInspectionLayout}
                >
                  {inspectionItems.map((item) => (
                    <View key={item.key} style={[styles.sliderPage, { width: inspectionCardWidth || CARD_WIDTH }]}>
                      <XStack alignItems="center" gap={12}>
                        <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                          <CalendarCheck size={20} color={colors.bluePrimary} />
                        </Stack>
                        <YStack gap={2} flex={1}>
                          {item.value ? (
                            <FormattedDate value={item.value} format="L" textProps={{ style: [styles.cardValue, { color: colors.textPrimary }] }} />
                          ) : (
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>-</Text>
                          )}
                          <Text style={[styles.cardLabel, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                        </YStack>
                      </XStack>
                    </View>
                  ))}
                </ScrollView>
              </Stack>
              <Stack style={[styles.infoCard, { backgroundColor: colors.bgCard, width: CARD_WIDTH, padding: 0, overflow: 'hidden' }]}>
                <ScrollView
                  ref={insuranceScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  style={{ width: '100%' }}
                  onLayout={handleInsuranceLayout}
                >
                  {insuranceItems.map((item, index) => (
                    <View key={item.siraNo ? String(item.siraNo) : `${item.sigorta}-${index}`} style={[styles.sliderPage, { width: insuranceCardWidth || CARD_WIDTH }]}>
                      <XStack alignItems="center" gap={12}>
                        <Stack style={[styles.iconWrapper, { backgroundColor: colors.blueTint }]}>
                          <ShieldCheck size={20} color={colors.bluePrimary} />
                        </Stack>
                        <YStack gap={2} flex={1}>
                          {item.bitisTarih ? (
                            <FormattedDate value={item.bitisTarih} format="L" textProps={{ style: [styles.cardValue, { color: colors.textPrimary }] }} />
                          ) : (
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>-</Text>
                          )}
                          <Text style={[styles.cardLabel, { color: colors.textSecondary }]} numberOfLines={1}>{item.sigorta}</Text>
                        </YStack>
                      </XStack>
                    </View>
                  ))}
                </ScrollView>
              </Stack>
            </XStack>
          </YStack>

          {/* Actions Section - 4 Buttons (2x2) */}
          <YStack gap={12} marginTop={24}>
            {/* Row 1 */}
            <XStack gap={12}>
              <Pressable style={{ width: CARD_WIDTH }} onPress={openFaultSheet}>
                <Stack style={[styles.actionButton, { backgroundColor: '#EF444414' }]}>
                  <TriangleAlert size={20} color={colors.redError} />
                  <Text style={[styles.actionText, { color: colors.redError }]}>{t('arizaBildir')}</Text>
                </Stack>
              </Pressable>
              <Pressable style={{ width: CARD_WIDTH }} onPress={openRequestSheet}>
                <Stack style={[styles.actionButton, { backgroundColor: '#F59E0B14' }]}>
                  <MapPin size={20} color={colors.amberWarning} />
                  <Text style={[styles.actionText, { color: colors.amberWarning }]}>{t('talepBildir')}</Text>
                </Stack>
              </Pressable>
            </XStack>

            {/* Row 2 */}
            <XStack gap={12}>
              <Pressable style={{ width: CARD_WIDTH }} onPress={openDocsSheet}>
                <Stack style={[styles.actionButton, { backgroundColor: '#8B5CF614' }]}>
                  <FileText size={20} color={colors.purple} />
                  <Text style={[styles.actionText, { color: colors.purple }]}>{t('aracBelgeleri')}</Text>
                </Stack>
              </Pressable>
              <Pressable style={{ width: CARD_WIDTH }} onPress={openPhotosSheet}>
                <Stack style={[styles.actionButton, { backgroundColor: '#F9731614' }]}>
                  <Camera size={20} color={colors.orange} />
                  <Text style={[styles.actionText, { color: colors.orange }]}>{t('aracFotograflari')}</Text>
                </Stack>
              </Pressable>
            </XStack>
          </YStack>

          {/* Reminders Section */}
          {Array.isArray(reminderData) && reminderData.filter((i: any) => i.count > 0).length > 0 && (
            <Stack style={[styles.remindersSection, { backgroundColor: colors.bgCard }]} marginTop={24}>
              <Text style={[styles.remindersHeader, { color: colors.textPrimary }]}>{t('reminder')}</Text>
              <YStack gap={12}>
                {(reminderData as { category: string; count: number }[])
                  .filter((i) => i.count > 0)
                  .map((item, index, arr) => {
                    const { icon: IconComponent, color } = getReminderIcon(item.category);
                    const isLast = index === arr.length - 1;
                    return (
                      <Pressable key={item.category}>
                        <XStack
                          alignItems="center"
                          gap={12}
                          paddingVertical={12}
                          borderBottomWidth={isLast ? 0 : 1}
                          borderBottomColor={colors.borderLight}
                        >
                          <Stack style={[styles.reminderIconWrapper, { backgroundColor: colors.bgElevated }]}>
                            <IconComponent size={18} color={color} />
                          </Stack>
                          <YStack flex={1} gap={2}>
                            <Text style={[styles.reminderTitle, { color: colors.textPrimary }]}>
                              {item.count} {t(item.category)}
                            </Text>
                          </YStack>
                          <ChevronRight size={20} color={colors.textTertiary} />
                        </XStack>
                      </Pressable>
                    );
                  })}
              </YStack>
            </Stack>
          )}
        </ScrollView>

        {/* Vehicle Selection Bottom Sheet */}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose
          handleIndicatorStyle={{ backgroundColor: isDark ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => (
            <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
          )}
          backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
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
                            {item.plaka}{' '}
                            <Text color={item.aktif ? '$green10' : '$red10'}>
                              {item.aktif ? `(${t('active')})` : `(${t('passive')})`}
                            </Text>
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
          handleIndicatorStyle={{ backgroundColor: isDark ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => (
            <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
          )}
          backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
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
          handleIndicatorStyle={{ backgroundColor: isDark ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => (
            <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
          )}
          backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
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
          handleIndicatorStyle={{ backgroundColor: isDark ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => (
            <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
          )}
          backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
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
          handleIndicatorStyle={{ backgroundColor: isDark ? '#9BA1A6' : '#A1A1AA' }}
          backdropComponent={(backdropProps) => (
            <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
          )}
          backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
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

        <FuelListBottomSheet sheetRef={fuelSheetRef} themeName={themeName} vehicleId={firstVehicle?.aracId} reloadToken={fuelReloadToken} />

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

      await apiService.addKmLog(kmLogData);
      Alert.alert(t('success'), t('kmUpdatedSuccessfully'));
      onSuccess();
    } catch (error: any) {
      console.error('Km update error:', error);
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
      backdropComponent={(backdropProps) => (
        <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
      )}
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
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$4" color="$color" opacity={0.7}>
                {t('sonKmTarihi')}:
              </Text>
              {firstVehicle?.sonKmTarih ? (
                <FormattedDate value={firstVehicle.sonKmTarih} format="L" textProps={{ fontSize: '$4', color: '$color', opacity: 0.7 }} />
              ) : (
                <Text fontSize="$4" color="$color" opacity={0.7}>
                  -
                </Text>
              )}
            </XStack>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  plateNumber: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  vehicleModel: {
    fontSize: 14,
    fontFamily: 'Inter',
    maxWidth: 180,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderPage: {
    padding: 16,
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Inter',
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  remindersSection: {
    borderRadius: 12,
    padding: 20,
  },
  remindersHeader: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  reminderIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
