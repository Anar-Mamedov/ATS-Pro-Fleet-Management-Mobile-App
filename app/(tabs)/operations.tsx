import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { Ionicons } from '@expo/vector-icons';
import { Stack, Text, useTheme } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutAnimation, Platform, ScrollView, TouchableOpacity, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SubMenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface MenuSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  childrenItems: SubMenuItem[];
  isOpen: boolean;
  onToggle: () => void;
}

function MenuSection({ title, icon, color, childrenItems, isOpen, onToggle }: MenuSectionProps) {
  const theme = useTheme();

  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      overflow="hidden"
      marginBottom="$3"
      borderWidth={1}
      borderColor="$borderColor"
      elevation={2}
      pressStyle={{ scale: 0.98 }}
      animation="quick"
    >
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <XStack padding="$4" alignItems="center" justifyContent="space-between" backgroundColor="$backgroundStrong">
          <XStack alignItems="center" space="$3">
            <Stack width={40} height={40} borderRadius="$3" backgroundColor={`${color}20`} alignItems="center" justifyContent="center">
              <Ionicons name={icon} size={22} color={color} />
            </Stack>
            <Text fontSize="$5" fontWeight="600" color="$color">
              {title}
            </Text>
          </XStack>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.color?.get() || '#8E8E93'} />
        </XStack>
      </TouchableOpacity>

      {isOpen && (
        <YStack paddingHorizontal="$4" paddingBottom="$3" paddingTop="$1">
          {childrenItems.map((item, index) => (
            <TouchableOpacity key={item.id} onPress={item.onPress} style={{ marginTop: index === 0 ? 4 : 12 }}>
              <XStack padding="$3" borderRadius="$3" backgroundColor="$background" alignItems="center" space="$3" borderWidth={1} borderColor="$borderColor">
                <Ionicons name={item.icon} size={18} color={color} />
                <Text fontSize="$4" color="$color" fontWeight="500">
                  {item.title}
                </Text>
                <Stack flex={1} />
                <Ionicons name="arrow-forward" size={16} color={theme.color?.get() || '#C7C7CC'} style={{ opacity: 0.5 }} />
              </XStack>
            </TouchableOpacity>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

export default function OperationsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomPad = useBottomBarPadding();
  const { themeName } = useThemeController();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fleet: true, // Default open
  });

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections((prev) => {
      const isCurrentlyOpen = prev[id];
      // If the clicked section is already open, close it (empty object or just set it false)
      // If it's closed, open it and close others (create new object with only this id true)
      return isCurrentlyOpen ? { [id]: false } : { [id]: true };
    });
  };

  const menuSections = [
    {
      id: 'fleet',
      title: t('fleetManagement'),
      icon: 'business' as const,
      color: '#007AFF', // Blue
      items: [
        {
          id: 'penalties',
          title: t('penalty'),
          icon: 'warning' as const,
          onPress: () => router.push('/operations/penalties'),
        },
      ],
    },
    {
      id: 'maintenance',
      title: t('maintenanceServiceManagement'),
      icon: 'construct' as const,
      color: '#FF9500',
      items: [
        {
          id: 'service-operations',
          title: t('serviceOperations'),
          icon: 'build' as const,
          onPress: () => console.log('Navigate to Service Operations'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F2F2F7' }}>
      <Stack flex={1} backgroundColor="$background">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomPad + 20, paddingTop: 20, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          <YStack space="$4">
            <Text fontSize="$8" fontWeight="bold" color="$color" marginBottom="$2">
              {t('operations')}
            </Text>

            {menuSections.map((section) => (
              <MenuSection
                key={section.id}
                title={section.title}
                icon={section.icon}
                color={section.color}
                childrenItems={section.items}
                isOpen={!!openSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </YStack>
        </ScrollView>
      </Stack>
    </SafeAreaView>
  );
}
