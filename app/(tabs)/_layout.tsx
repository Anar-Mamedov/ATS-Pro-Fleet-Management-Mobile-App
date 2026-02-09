import { apiService } from '@/services/apiService';
import { useThemeController } from '@/config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { Home, Repeat, Bell, User } from '@tamagui/lucide-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDark = themeName === 'dark';
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  const loadProfilePhoto = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('id');
      if (!userId) {
        setProfilePhotoUri(null);
        return;
      }
      const userData = await apiService.getUserInfoById(userId);
      if (userData?.defPhotoInfo?.tbResimId) {
        const photoArrayBuffer = await apiService.downloadPhotoById(userData.defPhotoInfo.tbResimId, userData.defPhotoInfo.rsmUzanti, userData.defPhotoInfo.rsmAd);
        if (photoArrayBuffer) {
          const base64String = arrayBufferToBase64(photoArrayBuffer);
          const mimeType = userData.defPhotoInfo.rsmUzanti.replace('.', '');
          setProfilePhotoUri(`data:image/${mimeType};base64,${base64String}`);
          return;
        }
      }
      setProfilePhotoUri(null);
    } catch (error) {
      console.error('Profile tab photo load failed:', error);
      setProfilePhotoUri(null);
    }
  }, [arrayBufferToBase64]);

  useEffect(() => {
    loadProfilePhoto();
  }, [loadProfilePhoto]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0A84FF',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#999999',
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: t('operations'),
          tabBarIcon: ({ color, size }) => <Repeat size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notifications'),
          href: null,
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => {
            if (profilePhotoUri) {
              return (
                <View style={styles.profileImageWrapper}>
                  <Image source={{ uri: profilePhotoUri }} style={styles.profileImage} resizeMode="cover" />
                </View>
              );
            }
            return <User size={size} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileImageWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
