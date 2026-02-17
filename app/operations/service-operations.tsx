import dayjs from '@/config/dayjs';
import { useThemeController } from '@/config/theme';
import { formatNumber } from '@/ui/components/formatNumber';
import { useVehicleContext } from '@/context/VehicleContext';
import { apiService } from '@/services/apiService';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Stack, Text, useTheme } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { XStack, YStack } from '@tamagui/stacks';
import { Stack as ExpoStack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, ListRenderItem, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ServiceOperation {
  siraNo: number;
  aracId: number;
  plaka: string;
  tarih: string;
  saat: string;
  servisTipi: string;
  servisTanimi: string;
  km: number;
  toplam: number;
  surucuIsim: string;
  islemiYapanText?: string;
  aciklama?: string;
}

export default function ServiceOperationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { themeName } = useThemeController();
  const bottomPad = useBottomBarPadding();
  const { selectedVehicleId } = useVehicleContext();

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dataSource, setDataSource] = useState<ServiceOperation[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  // Initial fetch
  useEffect(() => {
    if (selectedVehicleId) {
      fetchData(true);
    } else {
      setDataSource([]);
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId]);

  const fetchData = async (reset: boolean = false, searchTerm: string = search) => {
    // Prevent multiple fetches
    if (loading || loadingMore) return;
    if (!reset && !hasMore) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    if (!selectedVehicleId) {
      setDataSource([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      let currentSetPointId = 0;
      let diff = 0;

      if (reset) {
        currentSetPointId = 0;
        diff = 0;
      } else {
        currentSetPointId = dataSource[dataSource.length - 1]?.siraNo || 0;
        diff = 1;
      }

      const response = await apiService.getVehicleServicesByVehicleIds(selectedVehicleId ? [selectedVehicleId] : [], diff, currentSetPointId, searchTerm);

      const newData = response.list || [];

      if (reset) {
        setDataSource(newData);
        setHasMore(newData.length > 0);
      } else {
        const uniqueNewData = newData.filter((newItem: ServiceOperation) => !dataSource.some((existingItem) => existingItem.siraNo === newItem.siraNo));

        if (uniqueNewData.length > 0) {
          setDataSource((prev) => [...prev, ...uniqueNewData]);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching service operations:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    fetchData(true, search);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchData(false);
    }
  };

  const renderItem: ListRenderItem<ServiceOperation> = ({ item }) => {
    return (
      <Pressable onPress={() => router.push({ pathname: '/operations/service-detail', params: { siraNo: item.siraNo, plaka: item.plaka, servisTanimi: item.servisTanimi || item.servisTipi } })}>
      <YStack backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4" marginBottom="$3" borderWidth={1} borderColor="$borderColor" elevation={2}>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
          <Text fontSize="$5" fontWeight="bold" color="$color" flex={1} marginRight="$2" numberOfLines={1} ellipsizeMode="tail">
            {item.plaka}
          </Text>
          <Text fontSize="$3" color="$midGray">
            {dayjs(item.tarih).format('DD.MM.YYYY')}
          </Text>
        </XStack>

        <Text fontSize="$4" fontWeight="bold" color="$color" marginBottom="$1" numberOfLines={1} ellipsizeMode="tail">
          {item.servisTanimi || item.servisTipi}
        </Text>
        {item.aciklama ? (
          <Text fontSize="$3" color="$midGray" marginBottom="$2" numberOfLines={1} ellipsizeMode="tail">
            {item.aciklama}
          </Text>
        ) : null}

        <XStack justifyContent="space-between" alignItems="flex-end" marginTop="$2">
          <YStack flex={1} marginRight="$2">
            {item.islemiYapanText ? (
              <XStack alignItems="center" space="$2" marginBottom="$1">
                <Ionicons name="construct-outline" size={16} color={theme.color?.get()} />
                <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
                  {item.islemiYapanText}
                </Text>
              </XStack>
            ) : null}
            <XStack alignItems="center" space="$2">
              <Ionicons name="speedometer-outline" size={16} color={theme.color?.get()} />
              <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
                {formatNumber(item.km, i18n.language)} km
              </Text>
            </XStack>
          </YStack>

          <Text fontSize="$5" fontWeight="bold" color="$blue10">
            {formatNumber(item.toplam, i18n.language)} TL
          </Text>
        </XStack>
      </YStack>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <Stack height={20} />;
    return (
      <YStack paddingVertical="$4" alignItems="center">
        <ActivityIndicator size="small" color={theme.color?.get()} />
      </YStack>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F2F2F7' }}>
      <ExpoStack.Screen options={{ headerShown: false }} />
      <Stack flex={1} backgroundColor="$background">
        {/* Header */}
        <XStack paddingHorizontal="$4" paddingVertical="$3" alignItems="center" space="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
          <Button size="$3" chromeless icon={<Ionicons name="arrow-back" size={24} color={theme.color?.get()} />} onPress={() => router.back()} />
          <Text fontSize="$6" fontWeight="bold" color="$color">
            {t('serviceOperations')}
          </Text>
        </XStack>

        {/* Search Bar */}
        <YStack padding="$4" paddingBottom="$2">
          <XStack backgroundColor="$backgroundStrong" borderRadius="$4" borderWidth={1} borderColor="$borderColor" alignItems="center" paddingHorizontal="$3" height={50}>
            <Ionicons name="search" size={20} color={theme.color?.get() || '#8E8E93'} />
            <Input
              flex={1}
              backgroundColor="transparent"
              borderWidth={0}
              placeholder={t('search') || 'Ara...'}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              color="$color"
            />
            {search.length > 0 && (
              <Button
                size="$2"
                chromeless
                icon={<Ionicons name="close-circle" size={18} color={theme.color?.get() || '#8E8E93'} />}
                onPress={() => {
                  setSearch('');
                  fetchData(true, '');
                }}
              />
            )}
          </XStack>
        </YStack>

        {/* List */}
        <FlatList
          data={dataSource}
          renderItem={renderItem}
          keyExtractor={(item) => item.siraNo.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchData(true)} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading ? (
              <YStack alignItems="center" marginTop="$10" space="$4">
                <Ionicons name="construct-outline" size={64} color={theme.color?.get() || '#C7C7CC'} />
                <Text fontSize="$5" color="$midGray">
                  {t('noServiceRecordFound')}
                </Text>
              </YStack>
            ) : null
          }
        />
      </Stack>
    </SafeAreaView>
  );
}
