import { apiService } from '@/services/apiService';
import { FormattedDate } from '@/ui/components/FormattedDate';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type FuelListItem = {
  siraNo?: number;
  tarih?: string | null;
  saat?: string | null;
  lokasyon?: string | null;
  istasyon?: string | null;
  yakitTip?: string | null;
  miktar?: number | null;
  tutar?: number | null;
};

type FuelListBottomSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  themeName: string;
  vehicleId?: number | null;
  reloadToken: number;
};

export default function FuelListBottomSheet({ sheetRef, themeName, vehicleId, reloadToken }: FuelListBottomSheetProps) {
  const { t } = useTranslation();
  const [fuelList, setFuelList] = useState<FuelListItem[]>([]);
  const [fuelLoading, setFuelLoading] = useState<boolean>(false);
  const [fuelHasMore, setFuelHasMore] = useState<boolean>(true);
  const fuelListRef = useRef<FuelListItem[]>([]);
  const fuelLoadingRef = useRef<boolean>(false);
  const fuelSnapPoints = useMemo(() => ['70%', '90%'], []);

  useEffect(() => {
    fuelListRef.current = fuelList;
  }, [fuelList]);

  useEffect(() => {
    fuelLoadingRef.current = fuelLoading;
  }, [fuelLoading]);

  const renderFuelAmount = useCallback((value: number | null | undefined) => (value === null || value === undefined ? '-' : String(value)), []);

  const fetchFuelList = useCallback(
    async (diff: number, reset: boolean = false) => {
      if (!vehicleId || fuelLoadingRef.current) {
        return;
      }
      if (reset) {
        setFuelHasMore(true);
      }
      fuelLoadingRef.current = true;
      setFuelLoading(true);
      try {
        const currentList = reset ? [] : fuelListRef.current;
        let setPointId = 0;
        if (diff > 0) {
          setPointId = currentList[currentList.length - 1]?.siraNo || 0;
        } else if (diff < 0) {
          setPointId = currentList[0]?.siraNo || 0;
        }

        const response = await apiService.getFuelListByVehicleId([vehicleId], diff, setPointId, '');
        const newItems = Array.isArray(response?.fuel_list) ? response.fuel_list : [];
        const totalCount = typeof response?.total_count === 'number' ? response.total_count : 0;

        setFuelList((prev) => (reset ? newItems : [...prev, ...newItems]));

        const nextLength = (reset ? 0 : currentList.length) + newItems.length;
        setFuelHasMore(nextLength < totalCount);
      } catch (error) {
        console.error('Fuel list fetch error:', error);
        Alert.alert(t('error'), t('operationFailed'));
      } finally {
        fuelLoadingRef.current = false;
        setFuelLoading(false);
      }
    },
    [t, vehicleId]
  );

  useEffect(() => {
    setFuelList([]);
    setFuelHasMore(true);
    if (vehicleId && reloadToken > 0) {
      fetchFuelList(0, true);
    }
  }, [fetchFuelList, reloadToken, vehicleId]);

  const handleFuelEndReached = useCallback(() => {
    if (!fuelLoading && fuelHasMore) {
      fetchFuelList(1);
    }
  }, [fetchFuelList, fuelHasMore, fuelLoading]);

  const renderFuelItem = useCallback(
    ({ item }: { item: FuelListItem }) => (
      <YStack borderWidth={1} borderColor="$gray4" borderRadius="$3" padding="$3" backgroundColor="$backgroundStrong" gap="$2">
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <YStack flex={1} gap="$1">
            <XStack alignItems="center" gap="$2">
              <FormattedDate value={item.tarih ?? ''} format="L" textProps={{ fontSize: '$5', fontWeight: '600', color: '$color' }} />
              {item.saat ? (
                <Text fontSize="$4" color="$color" opacity={0.7}>
                  {item.saat}
                </Text>
              ) : null}
            </XStack>
            {item.lokasyon ? (
              <Text fontSize="$4" color="$color" opacity={0.7}>
                {item.lokasyon}
              </Text>
            ) : null}
            {item.istasyon ? (
              <Text fontSize="$4" color="$color" opacity={0.7}>
                {item.istasyon}
              </Text>
            ) : null}
          </YStack>
          <YStack alignItems="flex-end" gap="$1">
            <Text fontSize="$4" color="$color">
              {t('miktar')}: {renderFuelAmount(item.miktar)}
            </Text>
            <Text fontSize="$4" color="$color">
              {t('tutar')}: {renderFuelAmount(item.tutar)}
            </Text>
          </YStack>
        </XStack>
        {item.yakitTip ? (
          <Text fontSize="$4" color="$color" opacity={0.7}>
            {item.yakitTip}
          </Text>
        ) : null}
      </YStack>
    ),
    [renderFuelAmount, t]
  );

  const renderFuelSeparator = useCallback(() => <YStack height={12} />, []);

  const fuelKeyExtractor = useCallback((item: FuelListItem, index: number) => String(item.siraNo ?? index), []);

  const renderFuelEmpty = useCallback(
    () => (
      <YStack padding="$4" alignItems="center">
        <Text color="$color" opacity={0.7}>
          {fuelLoading ? t('loading') : t('noContentYet')}
        </Text>
      </YStack>
    ),
    [fuelLoading, t]
  );

  const renderFuelFooter = useCallback(() => {
    if (!fuelLoading || fuelList.length === 0) {
      return null;
    }
    return (
      <YStack padding="$3" alignItems="center">
        <Text color="$color" opacity={0.7}>
          {t('loading')}
        </Text>
      </YStack>
    );
  }, [fuelList.length, fuelLoading, t]);

  const fuelListHeader = useMemo(
    () => (
      <YStack paddingTop="$2" paddingBottom="$3">
        <Text fontSize="$6" fontWeight="600" textAlign="center" color="$color">
          {t('yakitKayitlari')}
        </Text>
      </YStack>
    ),
    [t]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={fuelSnapPoints}
      enablePanDownToClose
      topInset={46}
      handleIndicatorStyle={{ backgroundColor: themeName === 'dark' ? '#9BA1A6' : '#A1A1AA' }}
      backdropComponent={(backdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />}
      backgroundStyle={{ backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF' }}
    >
      <BottomSheetFlatList
        data={fuelList}
        keyExtractor={fuelKeyExtractor}
        renderItem={renderFuelItem}
        ItemSeparatorComponent={renderFuelSeparator}
        onEndReached={handleFuelEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={fuelListHeader}
        ListEmptyComponent={renderFuelEmpty}
        ListFooterComponent={renderFuelFooter}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
}
