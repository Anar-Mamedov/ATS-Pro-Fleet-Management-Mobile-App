import dayjs from '@/config/dayjs';
import { useThemeController } from '@/config/theme';
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

// Define the shape of the data based on the user's JSON response
interface VehicleFine {
  siraNo: number;
  plaka: string;
  aracId: number;
  tarih: string;
  saat: string;
  cezaTuru: string;
  tutar: number;
  lokasyon: string;
  surucuIsim: string;
}

export default function PenaltiesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { themeName } = useThemeController();
  const bottomPad = useBottomBarPadding();
  const { selectedVehicleId } = useVehicleContext();

  const [loading, setLoading] = useState(false); // General loading (refresh/initial)
  const [loadingMore, setLoadingMore] = useState(false); // Loading for infinite scroll
  const [dataSource, setDataSource] = useState<VehicleFine[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  // Initial fetch
  useEffect(() => {
    fetchData(true);
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

    try {
      let currentSetPointId = 0;
      let diff = 0;

      if (reset) {
        // Initial load or refresh or search
        currentSetPointId = 0;
        diff = 0;
      } else {
        // Load more (next page)
        currentSetPointId = dataSource[dataSource.length - 1]?.siraNo || 0;
        diff = 1;
      }

      const response = await apiService.getVehicleFinesListByVehicleId(selectedVehicleId ? [selectedVehicleId] : [], diff, currentSetPointId, searchTerm);

      const newData = response.list || [];

      if (reset) {
        setDataSource(newData);
        setHasMore(newData.length > 0);
      } else {
        // Filter out potential duplicates just in case, though API shouldn't return them if logic is correct
        const uniqueNewData = newData.filter((newItem: VehicleFine) => !dataSource.some((existingItem) => existingItem.siraNo === newItem.siraNo));

        if (uniqueNewData.length > 0) {
          setDataSource((prev) => [...prev, ...uniqueNewData]);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching fines:', error);
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

  const renderItem: ListRenderItem<VehicleFine> = ({ item }) => {
    return (
      <Pressable onPress={() => router.push({ pathname: '/operations/penalty-detail', params: { siraNo: item.siraNo, plaka: item.plaka, cezaTuru: item.cezaTuru } })}>
      <YStack backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4" marginBottom="$3" borderWidth={1} borderColor="$borderColor" elevation={2}>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
          <Text fontSize="$5" fontWeight="bold" color="$color">
            {item.plaka}
          </Text>
          <Text fontSize="$3" color="$midGray">
            {dayjs(item.tarih).format('DD.MM.YYYY')} - {item.saat}
          </Text>
        </XStack>

        <Text fontSize="$4" color="$color" marginBottom="$2" numberOfLines={2}>
          {item.cezaTuru}
        </Text>

        <XStack justifyContent="space-between" alignItems="flex-end">
          <YStack>
            <XStack alignItems="center" space="$2" marginBottom="$1">
              <Ionicons name="location-outline" size={16} color={theme.color?.get()} />
              <Text fontSize="$3" color="$midGray">
                {item.lokasyon}
              </Text>
            </XStack>
            <XStack alignItems="center" space="$2">
              <Ionicons name="person-outline" size={16} color={theme.color?.get()} />
              <Text fontSize="$3" color="$midGray">
                {item.surucuIsim}
              </Text>
            </XStack>
          </YStack>

          <Text fontSize="$5" fontWeight="bold" color="$red10">
            {item.tutar} TL
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
            {t('penalty')}
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
                <Ionicons name="document-text-outline" size={64} color={theme.color?.get() || '#C7C7CC'} />
                <Text fontSize="$5" color="$midGray">
                  {t('noPenaltyFound')}
                </Text>
              </YStack>
            ) : null
          }
        />
      </Stack>
    </SafeAreaView>
  );
}
