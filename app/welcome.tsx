import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';

export default function Welcome() {
  const { t } = useTranslation();

  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <Stack flex={1} backgroundColor="$background">
      <Image
        source={require('../assets/images/ats_login_image.webp')}
        style={{
          opacity: 0.8,
          width: '100%',
          height: '60%',
          borderBottomLeftRadius: 35,
          borderBottomRightRadius: 35,
          overflow: 'hidden',
        }}
        resizeMode="cover"
      />

      <YStack flex={1} justifyContent="center" alignItems="flex-start" padding="$4" space="$6">
        <YStack alignItems="flex-start" space="$4" width="100%">
          <Text fontSize="$10" fontWeight="600" textAlign="left" fontFamily="SF Pro Display">
            {t('welcomeToATS')}
          </Text>

          <Text fontSize="$5" color="$gray10" textAlign="left" lineHeight="$2" fontFamily="SF Pro Text">
            {t('welcomeDescription')}
          </Text>
        </YStack>

        <Button backgroundColor="$blue10" borderRadius="$6" width="100%" paddingVertical="$2" onPress={handleGetStarted} pressStyle={{ opacity: 0.8 }}>
          <Button.Text color="white" fontSize="$5" fontWeight="400" fontFamily="SF Pro Text">
            {t('login')}
          </Button.Text>
        </Button>
      </YStack>
    </Stack>
  );
}
