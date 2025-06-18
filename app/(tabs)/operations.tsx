import { Stack, Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { useTranslation } from 'react-i18next';

export default function OperationsTab() {
  const { t } = useTranslation();

  return (
    <Stack flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
          {t('operations')}
        </Text>
        <Text fontSize="$5" textAlign="center">
          {t('operations')} burada olacak
        </Text>
      </YStack>
    </Stack>
  );
}
