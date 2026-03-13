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

interface HgsOperation {
  siraNo: number;
  tarih: string;
  aracId: number;
  plaka: string;
  girisSaat: string;
  cikisSaat: string;
  surucuId: number;
  isim: string;
  girisTarih: string | null;
  cikisTarih: string | null;
  girisYeri: string;
  otoYol: string;
  cikisYeri: string;
  odemeTuru: string;
  gecisUcreti: number;
  odemeDurumu: string;
  fisNo: string;
  gecisKategorisi: string;
  guzergah: string;
  aciklama: string;
}

export default function HgsOperationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { themeName } = useThemeController();
  const bottomPad = useBottomBarPadding();
  const { selectedVehicleId } = useVehicleContext();

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dataSource, setDataSource] = useState<HgsOperation[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData(true);
  }, [selectedVehicleId]);

  const fetchData = async (reset: boolean = false, searchTerm: string = search) => {
    if (loading || loadingMore) return;
    if (!reset && !hasMore) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page + 1;

      const response = await apiService.getHgsOperationsList(
        selectedVehicleId ? [selectedVehicleId] : [],
        currentPage,
        10,
        searchTerm
      );

      const newData = response.list || [];

      if (reset) {
        setDataSource(newData);
        setPage(1);
        setHasMore(newData.length === 10);
      } else {
        const uniqueNewData = newData.filter(
          (newItem: HgsOperation) => !dataSource.some((existingItem) => existingItem.siraNo === newItem.siraNo)
        );

        if (uniqueNewData.length > 0) {
          setDataSource((prev) => [...prev, ...uniqueNewData]);
          setPage(currentPage);
          setHasMore(newData.length === 10);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching HGS operations:', error);
      setHasMore(false); // Hata durumunda loop'a girmemek için false yapıyoruz
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

  const renderItem: ListRenderItem<HgsOperation> = ({ item }) => {
    const formattedDate = item.tarih ? dayjs(item.tarih).format('DD.MM.YYYY') : '';
    const formattedTime = item.tarih ? dayjs(item.tarih).format('HH:mm') : '';
    const route = item.girisYeri || item.cikisYeri
      ? [item.girisYeri, item.cikisYeri].filter(Boolean).join(' → ')
      : '';

    return (
      <Pressable>
        <YStack
          backgroundColor="$backgroundStrong"
          borderRadius="$4"
          padding="$4"
          marginBottom="$3"
          borderWidth={1}
          borderColor="$borderColor"
          elevation={2}
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
            <Text fontSize="$5" fontWeight="bold" color="$color" flex={1} marginRight="$2" numberOfLines={1} ellipsizeMode="tail">
              {item.plaka}
            </Text>
            <Text fontSize="$3" color="$midGray">
              {formattedDate} {formattedTime ? `- ${formattedTime}` : ''}
            </Text>
          </XStack>

          {route ? (
            <XStack alignItems="center" gap="$2" marginBottom="$2">
              <Ionicons name="navigate-outline" size={16} color={theme.color?.get()} />
              <Text fontSize="$3" color="$color" numberOfLines={1} ellipsizeMode="tail" flex={1}>
                {route}
              </Text>
            </XStack>
          ) : null}

          {item.guzergah ? (
            <XStack alignItems="center" gap="$2" marginBottom="$2">
              <Ionicons name="map-outline" size={16} color={theme.color?.get()} />
              <Text fontSize="$3" color="$midGray" numberOfLines={1} ellipsizeMode="tail" flex={1}>
                {item.guzergah}
              </Text>
            </XStack>
          ) : null}

          <XStack justifyContent="space-between" alignItems="flex-end">
            <YStack gap="$1" flex={1} marginRight="$2">
              <XStack alignItems="center" gap="$2">
                <Ionicons name="person-outline" size={16} color={theme.color?.get()} />
                <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
                  {item.isim}
                </Text>
              </XStack>
              {item.gecisKategorisi ? (
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="car-outline" size={16} color={theme.color?.get()} />
                  <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
                    {item.gecisKategorisi}
                  </Text>
                </XStack>
              ) : null}
              {item.odemeTuru ? (
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="card-outline" size={16} color={theme.color?.get()} />
                  <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
                    {item.odemeTuru}
                  </Text>
                </XStack>
              ) : null}
            </YStack>

            <Text fontSize="$5" fontWeight="bold" color="#0EA5E9">
              {item.gecisUcreti.toFixed(2)} TL
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
            {t('hgsOperations')}
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
                <Ionicons name="card-outline" size={64} color={theme.color?.get() || '#C7C7CC'} />
                <Text fontSize="$5" color="$midGray">
                  {t('noHgsOperationFound')}
                </Text>
              </YStack>
            ) : null
          }
        />
      </Stack>
    </SafeAreaView>
  );
}
