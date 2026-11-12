import { apiService } from '@/services/apiService';
import { FormattedDate } from '@/ui/components/FormattedDate';
import { PagedRecordList } from '@/ui/components/PagedRecordList';
import { Ionicons } from '@expo/vector-icons';
import { Text, useTheme } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Accident {
  siraNo: number;
  plaka?: string;
  kazaTarih?: string;
  surucuIsim?: string;
  kazaTuru?: string;
  kazaSekli?: string;
  karsiPlaka?: string;
  aciklama?: string;
}

// Şoförün aracına ait kaza kayıtları. Fatura / geri ödeme tutarları şoförlere gösterilmez.
export default function AccidentReportsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const iconColor = theme.color?.get();

  const fetchPage = useCallback(
    (vehicleIds: number[], diff: number, setPointId: number, search: string) => apiService.getAccidentsByVehicleIds(vehicleIds, diff, setPointId, search),
    []
  );

  const renderItem = useCallback(
    (item: Accident) => (
      <YStack backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4" marginBottom="$3" borderWidth={1} borderColor="$borderColor" elevation={2}>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
          <Text fontSize="$5" fontWeight="bold" color="$color" flex={1} marginRight="$2" numberOfLines={1} ellipsizeMode="tail">
            {item.plaka || '-'}
          </Text>
          {item.kazaTarih ? <FormattedDate value={item.kazaTarih} format="L" textProps={{ fontSize: '$3', color: '$midGray' }} /> : null}
        </XStack>

        <Text fontSize="$4" fontWeight="bold" color="$color" marginBottom="$1" numberOfLines={1} ellipsizeMode="tail">
          {item.kazaTuru || item.kazaSekli || t('accident')}
        </Text>
        {item.aciklama ? (
          <Text fontSize="$3" color="$midGray" marginBottom="$1" numberOfLines={1} ellipsizeMode="tail">
            {item.aciklama}
          </Text>
        ) : null}

        {item.surucuIsim ? (
          <XStack alignItems="center" gap="$2" marginTop="$2">
            <Ionicons name="person-outline" size={16} color={iconColor} />
            <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
              {item.surucuIsim}
            </Text>
          </XStack>
        ) : null}
        {item.karsiPlaka ? (
          <XStack alignItems="center" gap="$2" marginTop="$1">
            <Ionicons name="car-outline" size={16} color={iconColor} />
            <Text fontSize="$3" color="$midGray" flex={1} numberOfLines={1} ellipsizeMode="tail">
              {t('oppositePlate')}: {item.karsiPlaka}
            </Text>
          </XStack>
        ) : null}
      </YStack>
    ),
    [iconColor, t]
  );

  return (
    <PagedRecordList<Accident>
      title={t('accidentReports')}
      emptyText={t('noRecordFound')}
      emptyIcon="car-outline"
      fetchPage={fetchPage}
      renderItem={renderItem}
    />
  );
}
