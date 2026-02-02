import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_BOTTOM_PADDING = 12;

const TAB_BAR_THEMES = {
  light: {
    background: '#FFFFFF',
    border: 'rgba(0,0,0,0.06)',
    active: '#00AEEF',
    inactive: '#7A7F8C',
    shadow: '#000',
  },
  dark: {
    background: '#0E1117',
    border: 'rgba(255,255,255,0.08)',
    active: '#00AEEF',
    inactive: '#8D94A1',
    shadow: '#000',
  },
} as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName } = useThemeController();
  const palette = TAB_BAR_THEMES[themeName];
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

  const renderProfileIcon = useCallback(
    ({ color, size }: { color: string; size: number }) => {
      const imageSize = size + 4;
      const containerStyle = {
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2,
        borderWidth: 2,
        borderColor: color,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        backgroundColor: palette.background,
      };
      if (!profilePhotoUri) {
        return (
          <View style={containerStyle}>
            <Ionicons name="person" size={size} color={color} />
          </View>
        );
      }
      return (
        <View style={containerStyle}>
          <Image source={{ uri: profilePhotoUri }} style={{ width: '100%', height: '100%', borderRadius: imageSize / 2 }} resizeMode="cover" />
        </View>
      );
    },
    [palette.background, profilePhotoUri]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: palette.active,
        tabBarInactiveTintColor: palette.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 6,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM_PADDING),
          paddingTop: 10,
          shadowColor: palette.shadow,
          shadowOpacity: 0.35,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 16,
          elevation: 30,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: t('operations'),
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notifications'),
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => renderProfileIcon({ color, size }),
        }}
      />
    </Tabs>
  );
}
