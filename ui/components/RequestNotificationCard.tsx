import { FormattedDate } from '@/ui/components/FormattedDate';
import { RecordBadge } from '@/ui/components/RecordBadge';
import { Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface RequestNotification {
  siraNo: number;
  talepNo?: string;
  plaka?: string;
  tarih?: string;
  aciklama?: string;
  talepDurum?: string;
  talepOncelik?: string;
  talepTur?: string;
}

// Backend kodları web ile aynı; arıza ekranı öncelikleri "Orta", "Yüksek" gibi yazdığı için karşılaştırma normalize edilir.
const normalizeCode = (value?: string) =>
  (value || '')
    .trim()
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const STATUS: Record<string, { key: string; color: string }> = {
  beklemede: { key: 'statusPending', color: '#F59E0B' },
  onaylandi: { key: 'statusApproved', color: '#3B82F6' },
  reddedildi: { key: 'statusRejected', color: '#EF4444' },
  tamamlandi: { key: 'statusCompleted', color: '#22C55E' },
};

const PRIORITY: Record<string, { key: string; color: string }> = {
  dusuk: { key: 'priorityLow', color: '#22C55E' },
  orta: { key: 'priorityMedium', color: '#3B82F6' },
  yuksek: { key: 'priorityHigh', color: '#F97316' },
  acil: { key: 'priorityUrgent', color: '#EF4444' },
};

const TYPE_KEYS = ['ariza', 'lastik', 'aksesuar', 'yakit', 'bakim', 'arac'];
const NEUTRAL = '#6B7280';

interface RequestNotificationCardProps {
  item: RequestNotification;
  /** Talep türü (arıza, lastik, ...) gösterilsin mi; yalnız arızaların listelendiği ekranda gereksiz. */
  showType?: boolean;
}

export function RequestNotificationCard({ item, showType = false }: RequestNotificationCardProps) {
  const { t } = useTranslation();

  const status = STATUS[normalizeCode(item.talepDurum)];
  const priority = PRIORITY[normalizeCode(item.talepOncelik)];
  const typeCode = normalizeCode(item.talepTur);
  const typeLabel = TYPE_KEYS.includes(typeCode) ? t(typeCode) : item.talepTur;
  const title = [item.talepNo, showType ? typeLabel : null].filter(Boolean).join(' · ');

  return (
    <YStack backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4" marginBottom="$3" borderWidth={1} borderColor="$borderColor" elevation={2}>
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
        <Text fontSize="$5" fontWeight="bold" color="$color" flex={1} marginRight="$2" numberOfLines={1} ellipsizeMode="tail">
          {item.plaka || '-'}
        </Text>
        {item.tarih ? <FormattedDate value={item.tarih} format="L" textProps={{ fontSize: '$3', color: '$midGray' }} /> : null}
      </XStack>

      {title ? (
        <Text fontSize="$4" fontWeight="bold" color="$color" marginBottom="$1" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      ) : null}
      {item.aciklama ? (
        <Text fontSize="$3" color="$midGray" numberOfLines={1} ellipsizeMode="tail">
          {item.aciklama}
        </Text>
      ) : null}

      {item.talepDurum || item.talepOncelik ? (
        <XStack gap="$2" marginTop="$3" flexWrap="wrap">
          {item.talepDurum ? <RecordBadge label={status ? t(status.key) : item.talepDurum} color={status?.color || NEUTRAL} /> : null}
          {item.talepOncelik ? <RecordBadge label={priority ? t(priority.key) : item.talepOncelik} color={priority?.color || NEUTRAL} /> : null}
        </XStack>
      ) : null}
    </YStack>
  );
}
