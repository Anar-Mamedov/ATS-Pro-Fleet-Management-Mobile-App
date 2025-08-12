import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/apiService';

export default function DriverMainPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [aracIds, setAracIds] = useState<number[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const getUserInfo = async () => {
    const id = await AsyncStorage.getItem('id');
    if (id) {
      const data = await apiService.getUserInfoById(id);
      setAracIds(Array.isArray(data?.aracIds) ? data.aracIds : []);
    }
  };

  const getDriverDashboardCardSection = async () => {
    const data = await apiService.getDriverDashboardCardSection(aracIds);
    setVehicleData(data);
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    if (aracIds.length > 0) {
      getDriverDashboardCardSection();
    }
  }, [aracIds]);

  const firstVehicle = Array.isArray(vehicleData) && vehicleData.length > 0 ? vehicleData[selectedIndex] : null;

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['30%', '50%'], []);
  const openSheet = () => bottomSheetModalRef.current?.present();
  const closeSheet = () => bottomSheetModalRef.current?.dismiss();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <Stack flex={1} backgroundColor="$background">
        <Pressable onPress={openSheet} style={{ width: '100%' }}>
          <YStack justifyContent="flex-start" alignItems="flex-start" padding="$4" gap="$2">
            {firstVehicle && (
              <>
                <Text fontSize="$8" fontWeight="bold">
                  {firstVehicle.plaka}
                </Text>
                <Text fontSize="$5" color="$gray11">
                  {firstVehicle.model} |<Text color={firstVehicle.aktif ? '$green10' : '$red10'}> {firstVehicle.aktif ? t('active') : t('passive')}</Text>
                </Text>
              </>
            )}
          </YStack>
          <YStack justifyContent="flex-start" alignItems="flex-start" padding="$4" gap="$2">
            <YStack borderWidth={1} borderColor="$gray4" borderRadius="$3" padding="$2" gap="$2">
              <XStack alignItems="center" space="$3">
                <MaterialIcons name="speed" size={24} color="#007AFF" />
                <YStack>
                  <Text fontSize="$5" fontWeight="600">{firstVehicle?.guncelKm} km</Text>
                  <Text color="$gray11">{t('guncelKm')}</Text>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Pressable>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
        >
          <BottomSheetView style={{ flex: 1, paddingTop: 20 }}>
            <YStack space="$1">
              <Text fontSize="$6" fontWeight="600" textAlign="center" marginBottom="$4">
                {t('araclar')}
              </Text>
              <BottomSheetFlatList
                data={Array.isArray(vehicleData) ? vehicleData : []}
                keyExtractor={(item) => String(item.aracId)}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                ItemSeparatorComponent={() => <YStack height={1} backgroundColor="$gray4" />}
                renderItem={({ item, index }) => {
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
                          <Text fontSize="$6" fontWeight="600">
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
      </Stack>
    </SafeAreaView>
  );
}
