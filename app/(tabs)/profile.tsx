import LanguageSelector from '@/app/components/profile/LanguageSelector';
import PasswordUpdate from '@/app/components/profile/PasswordUpdate';
import PersoneInformationUpdate from '@/app/components/profile/PersoneInformationUpdate';
import ProfileUserInfo from '@/app/components/profile/ProfileUserInfo';
import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { ChevronLeft, ChevronRight, Globe, Lock, Moon, Sun, User } from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text, styled, getVariable, useTheme } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Styled components using standard Tamagui theme tokens
const MenuSection = styled(YStack, {
  backgroundColor: '$backgroundStrong',
  borderRadius: 16,
  overflow: 'hidden',
});

const MenuItem = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const MenuItemLeft = styled(XStack, {
  alignItems: 'center',
  gap: 16,
});

const MenuItemText = styled(Text, {
  fontSize: 16,
  fontWeight: '500',
  color: '$color',
});

const LogoutButton = styled(Stack, {
  backgroundColor: '$backgroundStrong',
  borderRadius: 16,
  height: 54,
  alignItems: 'center',
  justifyContent: 'center',
});

const LogoutText = styled(Text, {
  fontSize: 16,
  fontWeight: '600',
  color: '$error',
});

export default function ProfileTab() {
  const { t } = useTranslation();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const bottomPad = useBottomBarPadding();
  const { themeName, toggleTheme, isHydrated } = useThemeController();
  const theme = useTheme();
  const isDark = themeName === 'dark';

  // For non-Tamagui components (SafeAreaView, Switch)
  const bgColor = getVariable(theme.background);
  const borderColor = getVariable(theme.borderColor);
  const accentBg = getVariable(theme.accentBackground);
  const textColor = getVariable(theme.color);
  const mutedColor = getVariable(theme.placeholderColor);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  if (showPersonalInfo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} backgroundColor="$background">
          <YStack flex={1} padding="$4">
            <YStack marginBottom="$6" position="relative" width="100%" alignItems="center">
              <Pressable
                onPress={() => setShowPersonalInfo(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  zIndex: 1,
                }}
              >
                <ChevronLeft size={24} color={textColor} />
              </Pressable>

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
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} backgroundColor="$background">
          <YStack flex={1} padding="$4">
            <YStack marginBottom="$6" position="relative" width="100%" alignItems="center">
              <Pressable
                onPress={() => setShowPasswordUpdate(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  zIndex: 1,
                }}
              >
                <ChevronLeft size={24} color={textColor} />
              </Pressable>

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
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <YStack paddingHorizontal={24} paddingBottom={24} gap={32}>
          {/* Profile Header */}
          <Stack alignItems="center" width="100%">
            <ProfileUserInfo />
          </Stack>

          {/* Menu Section */}
          <MenuSection>
            {/* Personal Information */}
            <Pressable onPress={() => setShowPersonalInfo(true)}>
              <MenuItem>
                <MenuItemLeft>
                  <User size={22} color={textColor} />
                  <MenuItemText>{t('personalInformation')}</MenuItemText>
                </MenuItemLeft>
                <ChevronRight size={20} color={mutedColor} />
              </MenuItem>
            </Pressable>

            {/* Update Password */}
            <Pressable onPress={() => setShowPasswordUpdate(true)}>
              <MenuItem>
                <MenuItemLeft>
                  <Lock size={22} color={textColor} />
                  <MenuItemText>{t('updatePassword')}</MenuItemText>
                </MenuItemLeft>
                <ChevronRight size={20} color={mutedColor} />
              </MenuItem>
            </Pressable>

            {/* Theme Toggle */}
            <MenuItem borderBottomWidth={0}>
              <MenuItemLeft>
                {isDark ? (
                  <Moon size={22} color={textColor} />
                ) : (
                  <Sun size={22} color={textColor} />
                )}
                <MenuItemText>{isDark ? t('darkMode') : t('lightMode')}</MenuItemText>
              </MenuItemLeft>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                disabled={!isHydrated}
                trackColor={{ false: borderColor, true: accentBg }}
                thumbColor="#FFFFFF"
              />
            </MenuItem>
          </MenuSection>

          {/* Language Section */}
          <MenuSection>
            <MenuItem borderBottomWidth={0}>
              <MenuItemLeft>
                <Globe size={22} color={textColor} />
                <MenuItemText>{t('language')}</MenuItemText>
              </MenuItemLeft>
              <LanguageSelector />
            </MenuItem>
          </MenuSection>

          {/* Logout Button */}
          <Pressable onPress={handleLogout}>
            <LogoutButton>
              <LogoutText>{t('logout')}</LogoutText>
            </LogoutButton>
          </Pressable>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
