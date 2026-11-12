import { useThemeController } from '@/config/theme';
import { useVehicleContext } from '@/context/VehicleContext';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Stack, Text, useTheme } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { XStack, YStack } from '@tamagui/stacks';
import { Stack as ExpoStack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface PagedRecord {
  siraNo: number;
}

export interface PagedRecordListProps<T extends PagedRecord> {
  title: string;
  emptyText: string;
  emptyIcon: IoniconName;
  /** Seçili aracın kayıtlarından bir sayfa getirir (diff: 0 ilk sayfa, 1 sonraki; setPointId: son kaydın siraNo'su). */
  fetchPage: (vehicleIds: number[], diff: number, setPointId: number, search: string) => Promise<{ list?: T[] }>;
  renderItem: (item: T) => React.ReactElement;
}

// İşlemler sekmesindeki kayıt listeleri için ortak ekran: yalnızca seçili aracın (şoförün aracı) kayıtları,
// arama, aşağı kaydırınca sonraki sayfa ve aşağı çekince yenileme. Servis İşlemleri listesiyle aynı davranış.
export function PagedRecordList<T extends PagedRecord>({ title, emptyText, emptyIcon, fetchPage, renderItem }: PagedRecordListProps<T>) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { themeName } = useThemeController();
  const bottomPad = useBottomBarPadding();
  const { selectedVehicleId } = useVehicleContext();

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const itemsRef = useRef<T[]>([]);
  const busyRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);

  useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  const load = useCallback(
    async (reset: boolean, term: string) => {
      if (busyRef.current) return;
      if (!selectedVehicleId) {
        itemsRef.current = [];
        setItems([]);
        setHasMore(false);
        return;
      }

      busyRef.current = true;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const current = reset ? [] : itemsRef.current;
        const setPointId = current[current.length - 1]?.siraNo || 0;
        const response = await fetchPageRef.current([selectedVehicleId], reset ? 0 : 1, setPointId, term);
        const page = response?.list || [];
        const newItems = page.filter((item) => !current.some((existing) => existing.siraNo === item.siraNo));
        const next = [...current, ...newItems];

        itemsRef.current = next;
        setItems(next);
        setHasMore(newItems.length > 0);
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
      } finally {
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedVehicleId, title]
  );

  useEffect(() => {
    load(true, '');
  }, [load]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      load(false, search);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F2F2F7' }}>
      <ExpoStack.Screen options={{ headerShown: false }} />
      <Stack flex={1} backgroundColor="$background">
        <XStack paddingHorizontal="$4" paddingVertical="$3" alignItems="center" space="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
          <Button size="$3" chromeless icon={<Ionicons name="arrow-back" size={24} color={theme.color?.get()} />} onPress={() => router.back()} />
          <Text fontSize="$6" fontWeight="bold" color="$color" flex={1} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </XStack>

        <YStack padding="$4" paddingBottom="$2">
          <XStack backgroundColor="$backgroundStrong" borderRadius="$4" borderWidth={1} borderColor="$borderColor" alignItems="center" paddingHorizontal="$3" height={50}>
            <Ionicons name="search" size={20} color={theme.color?.get() || '#8E8E93'} />
            <Input
              flex={1}
              backgroundColor="transparent"
              borderWidth={0}
              placeholder={t('search')}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => load(true, search)}
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
                  load(true, '');
                }}
              />
            )}
          </XStack>
        </YStack>

        <FlatList
          data={items}
          renderItem={({ item }) => renderItem(item)}
          keyExtractor={(item) => item.siraNo.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(true, search)} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <YStack paddingVertical="$4" alignItems="center">
                <ActivityIndicator size="small" color={theme.color?.get()} />
              </YStack>
            ) : (
              <Stack height={20} />
            )
          }
          ListEmptyComponent={
            !loading ? (
              <YStack alignItems="center" marginTop="$10" space="$4">
                <Ionicons name={emptyIcon} size={64} color={theme.color?.get() || '#C7C7CC'} />
                <Text fontSize="$5" color="$midGray">
                  {emptyText}
                </Text>
              </YStack>
            ) : null
          }
        />
      </Stack>
    </SafeAreaView>
  );
}
