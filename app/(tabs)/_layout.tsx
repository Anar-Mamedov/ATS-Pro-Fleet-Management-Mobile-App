import { apiService } from '@/services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { Home, Repeat, Bell, User } from '@tamagui/lucide-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from '@tamagui/core';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const { t } = useTranslation();
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
      }}
      tabBar={(props) => <CustomTabBar {...props} profilePhotoUri={profilePhotoUri} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: t('operations'),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notifications'),
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
        }}
      />
    </Tabs>
  );
}

interface CustomTabBarProps extends BottomTabBarProps {
  profilePhotoUri: string | null;
}

function CustomTabBar({ state, descriptors, navigation, profilePhotoUri }: CustomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Filter out hidden tabs
  const hiddenTabs = ['notifications'];
  const visibleRoutes = state.routes.filter((route) => !hiddenTabs.includes(route.name));

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? '#FFFFFF' : '#8E8E93';
    const size = isFocused ? 20 : 24;

    switch (routeName) {
      case 'index':
        return <Home size={size} color={color} />;
      case 'operations':
        return <Repeat size={size} color={color} />;
      case 'notifications':
        return <Bell size={size} color={color} />;
      case 'profile':
        return <User size={size} color={color} />;
      default:
        return <Home size={size} color={color} />;
    }
  };

  const getLabel = (routeName: string): string => {
    switch (routeName) {
      case 'index':
        return t('home');
      case 'operations':
        return t('operations');
      case 'notifications':
        return t('notifications');
      case 'profile':
        return t('profile');
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.navBarWrapper}>
        <View style={styles.navBar}>
        {visibleRoutes.map((route) => {
          const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
          const label = getLabel(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Profile tab with photo
          if (route.name === 'profile') {
            return (
              <Pressable key={route.key} onPress={onPress} onLongPress={onLongPress} style={styles.tabItem}>
                <View style={styles.iconContainer}>
                  {isFocused ? (
                    <LinearGradient colors={['#0A84FF', '#0066CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activeIconWrapper}>
                      {profilePhotoUri ? (
                        <Image source={{ uri: profilePhotoUri }} style={styles.profileImage} resizeMode="cover" />
                      ) : (
                        <User size={20} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  ) : profilePhotoUri ? (
                    <View style={styles.profileImageWrapper}>
                      <Image source={{ uri: profilePhotoUri }} style={styles.profileImageInactive} resizeMode="cover" />
                    </View>
                  ) : (
                    <User size={24} color="#8E8E93" />
                  )}
                </View>
                <Text numberOfLines={1} style={[styles.label, isFocused ? styles.activeLabel : styles.inactiveLabel]}>{label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} onLongPress={onLongPress} style={styles.tabItem}>
              <View style={styles.iconContainer}>
                {isFocused ? (
                  <LinearGradient colors={['#0A84FF', '#0066CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activeIconWrapper}>
                    {getIcon(route.name, true)}
                  </LinearGradient>
                ) : (
                  getIcon(route.name, false)
                )}
              </View>
              <Text numberOfLines={1} style={[styles.label, isFocused ? styles.activeLabel : styles.inactiveLabel]}>{label}</Text>
            </Pressable>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
  },
  navBarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 24,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    width: 85,
  },
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // Glow shadow
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 11,
  },
  activeLabel: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#8E8E93',
    fontWeight: '500',
  },
  profileImageWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  profileImageInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
