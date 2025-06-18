import { Ionicons } from '@expo/vector-icons';
import { XStack, YStack } from '@tamagui/stacks';
import { BlurView } from 'expo-blur';
import { Slot, router, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    { href: '/', icon: 'home', label: t('home') },
    { href: '/operations', icon: 'briefcase', label: t('operations') },
    { href: '/notifications', icon: 'notifications', label: t('notifications') },
    { href: '/profile', icon: 'person', label: t('profile') },
  ];

  return (
    <YStack flex={1}>
      {/* Child screens */}
      <Slot />

      {/* Floating bottom navigation with BlurView (frosted glass) */}
      <BlurView
        intensity={40}
        tint="light"
        style={{
          position: 'absolute',
          bottom: 30,
          alignSelf: 'center',
          height: 64,
          width: 250,
          borderRadius: 32,
          overflow: 'hidden',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        <XStack flex={1} alignItems="center" justifyContent="space-around">
          {tabs.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);

            return (
              <Pressable key={tab.href} onPress={() => router.push(tab.href as any)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tab.icon as any} size={24} color={isActive ? '#ff4400' : '#8E8E93'} />
              </Pressable>
            );
          })}
        </XStack>
      </BlurView>
    </YStack>
  );
}
