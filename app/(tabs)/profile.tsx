import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../config/i18n';

export default function ProfileTab() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
  };

  return (
    <Stack flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" space="$4">
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
          {t('profile')}
        </Text>

        <Text fontSize="$6" fontWeight="600" marginBottom="$2">
          {t('language')}
        </Text>

        <XStack space="$2" flexWrap="wrap" justifyContent="center">
          <Button
            size="$3"
            backgroundColor={i18n.language === 'tr' ? '$blue10' : '$gray5'}
            color={i18n.language === 'tr' ? 'white' : '$color'}
            onPress={() => handleLanguageChange('tr')}
          >
            Türkçe
          </Button>
          <Button
            size="$3"
            backgroundColor={i18n.language === 'en' ? '$blue10' : '$gray5'}
            color={i18n.language === 'en' ? 'white' : '$color'}
            onPress={() => handleLanguageChange('en')}
          >
            English
          </Button>
          <Button
            size="$3"
            backgroundColor={i18n.language === 'ru' ? '$blue10' : '$gray5'}
            color={i18n.language === 'ru' ? 'white' : '$color'}
            onPress={() => handleLanguageChange('ru')}
          >
            Русский
          </Button>
          <Button
            size="$3"
            backgroundColor={i18n.language === 'az' ? '$blue10' : '$gray5'}
            color={i18n.language === 'az' ? 'white' : '$color'}
            onPress={() => handleLanguageChange('az')}
          >
            Azərbaycan
          </Button>
        </XStack>

        <Text fontSize="$5" textAlign="center" marginTop="$4">
          {t('settings')}
        </Text>
      </YStack>
    </Stack>
  );
}
