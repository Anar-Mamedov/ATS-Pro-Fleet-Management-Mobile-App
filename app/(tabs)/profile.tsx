import LanguageSelector from '@/app/components/profile/LanguageSelector';
import PasswordUpdate from '@/app/components/profile/PasswordUpdate';
import PersoneInformationUpdate from '@/app/components/profile/PersoneInformationUpdate';
import ProfileUserInfo from '@/app/components/profile/ProfileUserInfo';
import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { ChevronLeft, ChevronRight, Globe, Lock, Moon, Sun, User } from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileTab() {
  const { t } = useTranslation();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const bottomPad = useBottomBarPadding();
  const { themeName, toggleTheme, isHydrated } = useThemeController();
  const isDark = themeName === 'dark';

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  if (showPersonalInfo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F8F8F8' }} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} backgroundColor={isDark ? '#000000' : '#F8F8F8'}>
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
                <ChevronLeft size={24} color={isDark ? '#A1A1AA' : '#18181B'} />
              </Pressable>

              <Text fontSize="$6" fontWeight="600" color={isDark ? '#FFFFFF' : '#18181B'}>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F8F8F8' }} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} backgroundColor={isDark ? '#000000' : '#F8F8F8'}>
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
                <ChevronLeft size={24} color={isDark ? '#A1A1AA' : '#18181B'} />
              </Pressable>

              <Text fontSize="$6" fontWeight="600" color={isDark ? '#FFFFFF' : '#18181B'}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F8F8F8' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F8F8F8' }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <ProfileUserInfo />
          </View>

          {/* Menu Section */}
          <View style={[styles.menuSection, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Personal Information */}
            <Pressable
              onPress={() => setShowPersonalInfo(true)}
              style={[styles.menuItem, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E7' }]}
            >
              <View style={styles.menuItemLeft}>
                <User size={22} color={isDark ? '#FFFFFF' : '#18181B'} />
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                  {t('personalInformation')}
                </Text>
              </View>
              <ChevronRight size={20} color="#A1A1AA" />
            </Pressable>

            {/* Update Password */}
            <Pressable
              onPress={() => setShowPasswordUpdate(true)}
              style={[styles.menuItem, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E7' }]}
            >
              <View style={styles.menuItemLeft}>
                <Lock size={22} color={isDark ? '#FFFFFF' : '#18181B'} />
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                  {t('updatePassword')}
                </Text>
              </View>
              <ChevronRight size={20} color="#A1A1AA" />
            </Pressable>

            {/* Theme Toggle */}
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <View style={styles.menuItemLeft}>
                {isDark ? (
                  <Moon size={22} color="#FFFFFF" />
                ) : (
                  <Sun size={22} color="#18181B" />
                )}
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                  {isDark ? t('darkMode') || 'Karanlık Mod' : t('lightMode') || 'Aydınlık Mod'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                disabled={!isHydrated}
                trackColor={{ false: '#E5E5E7', true: '#0A84FF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Language Section */}
          <View style={[styles.menuSection, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <View style={styles.menuItemLeft}>
                <Globe size={22} color={isDark ? '#FFFFFF' : '#18181B'} />
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                  {t('language')}
                </Text>
              </View>
              <LanguageSelector />
            </View>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          >
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 32,
  },
  profileHeader: {
    alignItems: 'center',
    width: '100%',
  },
  menuSection: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
