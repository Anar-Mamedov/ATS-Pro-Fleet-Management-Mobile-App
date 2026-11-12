import { apiService } from '@/services/apiService';
import { PagedRecordList } from '@/ui/components/PagedRecordList';
import { RequestNotification, RequestNotificationCard } from '@/ui/components/RequestNotificationCard';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// type=ariza: yalnız arıza bildirimleri (web Arıza Bildirimleri); aksi halde tüm talepler (web Talep Yönetimi).
export default function RequestNotificationsScreen() {
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isFault = type === 'ariza';

  const fetchPage = useCallback(
    (vehicleIds: number[], diff: number, setPointId: number, search: string) =>
      apiService.getRequestNotificationsByVehicleIds(vehicleIds, diff, setPointId, search, isFault ? 'ariza' : undefined),
    [isFault]
  );

  const renderItem = useCallback((item: RequestNotification) => <RequestNotificationCard item={item} showType={!isFault} />, [isFault]);

  return (
    <PagedRecordList<RequestNotification>
      title={isFault ? t('faultReports') : t('requestReports')}
      emptyText={t('noRecordFound')}
      emptyIcon={isFault ? 'warning-outline' : 'document-text-outline'}
      fetchPage={fetchPage}
      renderItem={renderItem}
    />
  );
}
