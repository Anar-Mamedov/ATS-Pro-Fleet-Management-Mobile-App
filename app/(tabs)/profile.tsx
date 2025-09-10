import LanguageSelector from '@/app/components/profile/LanguageSelector';
import PasswordUpdate from '@/app/components/profile/PasswordUpdate';
import PersoneInformationUpdate from '@/app/components/profile/PersoneInformationUpdate';
import ProfileUserInfo from '@/app/components/profile/ProfileUserInfo';
import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileTab() {
  const { t } = useTranslation();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const bottomPad = useBottomBarPadding();
  const { themeName, toggleTheme, isHydrated } = useThemeController();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  if (showPersonalInfo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#FFFFFF' }} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} backgroundColor="$background">
          <YStack flex={1} padding="$4">
            <YStack marginBottom="$6" position="relative" width="100%" alignItems="center">
              <TouchableOpacity
                onPress={() => setShowPersonalInfo(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  zIndex: 1,
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#9BA1A6" />
              </TouchableOpacity>

              <Text fontSize="$6" fontWeight="600" color="$color">
                {t('personalInformation')}
              </Text>
            </YStack>

            <PersoneInformationUpdate onSuccess={() => setShowPersonalInfo(false)} />
          </YStack>
        </Stack>
      </SafeAreaView>
    );
  }

  if (showPasswordUpdate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#FFFFFF' }} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} backgroundColor="$background">
          <YStack flex={1} padding="$4">
            <YStack marginBottom="$6" position="relative" width="100%" alignItems="center">
              <TouchableOpacity
                onPress={() => setShowPasswordUpdate(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  zIndex: 1,
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#9BA1A6" />
              </TouchableOpacity>

              <Text fontSize="$6" fontWeight="600" color="$color">
                {t('updatePassword')}
              </Text>
            </YStack>

            <PasswordUpdate />
          </YStack>
        </Stack>
      </SafeAreaView>
    );
  }

  return (
    <Stack flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" paddingBottom={bottomPad} space="$4">
        <ProfileUserInfo />

        <XStack justifyContent="space-between" alignItems="center" width="100%" onPress={() => setShowPersonalInfo(true)}>
          <Text fontSize="$5" marginBottom="$2" color="$color">
            {t('personalInformation')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
        </XStack>

        <XStack justifyContent="space-between" alignItems="center" width="100%" onPress={() => setShowPasswordUpdate(true)}>
          <Text fontSize="$5" marginBottom="$2" color="$color">
            {t('updatePassword')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
        </XStack>

        <XStack justifyContent="space-between" alignItems="center" width="100%">
          <Text fontSize="$5" fontWeight="600" marginBottom="$2" color="$color">
            {themeName === 'dark' ? 'Karanlık Mod' : 'Aydınlık Mod'}
          </Text>
          <Switch value={themeName === 'dark'} onValueChange={toggleTheme} disabled={!isHydrated} />
        </XStack>

        <XStack justifyContent="space-between" alignItems="center" width="100%">
          <Text fontSize="$5" fontWeight="600" marginBottom="$2" color="$color">
            {t('language')}
          </Text>

          <LanguageSelector />
        </XStack>
        <XStack alignItems="center" width="100%" justifyContent="center">
          <Text color="$red10" onPress={handleLogout} fontSize="$5" fontWeight="700">
            {t('logout')}
          </Text>
        </XStack>
      </YStack>
    </Stack>
  );
}
