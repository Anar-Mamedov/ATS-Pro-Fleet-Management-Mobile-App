import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { Stack, Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { useTranslation } from 'react-i18next';

export default function NotificationsTab() {
  const { t } = useTranslation();
  const bottomPad = useBottomBarPadding();

  return (
    <Stack flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" paddingBottom={bottomPad}>
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
          {t('notifications')}
        </Text>
        <Text fontSize="$5" textAlign="center">
          {t('notifications')} burada olacak
        </Text>
      </YStack>
    </Stack>
  );
}
