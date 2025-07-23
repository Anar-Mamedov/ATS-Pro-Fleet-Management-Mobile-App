import { Ionicons } from '@expo/vector-icons';
import { Stack, Text, View } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItem {
  id: string;
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  count: number;
  subtitle?: string;
}

export default function OperationsTab() {
  const { t } = useTranslation();

  const menuItems: MenuItem[] = [
    {
      id: 'fuel-operations',
      titleKey: 'fuelOperations',
      icon: 'car',
      iconColor: '#ffffff',
      iconBackground: '#34C759',
      count: 6,
    },
    {
      id: 'maintenance-history',
      titleKey: 'maintenanceHistory',
      icon: 'build',
      iconColor: '#ffffff',
      iconBackground: '#FF9500',
      count: 4,
    },
    {
      id: 'km-history',
      titleKey: 'kmHistory',
      icon: 'speedometer',
      iconColor: '#ffffff',
      iconBackground: '#007AFF',
      count: 0,
      subtitle: 'Son 10 gün yok',
    },
    {
      id: 'breakdown-reports',
      titleKey: 'breakdownReports',
      icon: 'warning',
      iconColor: '#ffffff',
      iconBackground: '#FF3B30',
      count: 3,
    },
    {
      id: 'requests',
      titleKey: 'requests',
      icon: 'document-text',
      iconColor: '#ffffff',
      iconBackground: '#FF9500',
      count: 1,
    },
    {
      id: 'penalties',
      titleKey: 'penalties',
      icon: 'shield',
      iconColor: '#ffffff',
      iconBackground: '#34C759',
      count: 2,
    },
    {
      id: 'renewals',
      titleKey: 'renewals',
      icon: 'refresh',
      iconColor: '#ffffff',
      iconBackground: '#007AFF',
      count: 2,
    },
    {
      id: 'documents',
      titleKey: 'documents',
      icon: 'folder',
      iconColor: '#ffffff',
      iconBackground: '#34C759',
      count: 5,
    },
    {
      id: 'photos',
      titleKey: 'photos',
      icon: 'camera',
      iconColor: '#ffffff',
      iconBackground: '#8E8E93',
      count: 8,
    },
  ];

  const handleMenuPress = (menuId: string) => {
    console.log('Menu pressed:', menuId);
    // TODO: Navigate to specific menu screen
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack flex={1} backgroundColor="$background">
        <ScrollView style={{ flex: 1 }}>
          <YStack padding="$4" space="$3">
            <Text fontSize="$7" fontWeight="bold" marginBottom="$2">
              {t('operations')}
            </Text>

            <Text fontSize="$4" color="$gray10" marginBottom="$4">
              Tümü
            </Text>

            {menuItems.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleMenuPress(item.id)}>
                <XStack
                  backgroundColor="white"
                  padding="$4"
                  borderRadius="$3"
                  alignItems="center"
                  justifyContent="space-between"
                  marginBottom="$2"
                  borderWidth={1}
                  borderColor="$gray4"
                >
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View width={40} height={40} borderRadius={8} backgroundColor={item.iconBackground} alignItems="center" justifyContent="center">
                      <Ionicons name={item.icon} size={20} color={item.iconColor} />
                    </View>

                    <YStack flex={1}>
                      <Text fontSize="$4" fontWeight="500">
                        {t(item.titleKey)}
                      </Text>
                      {item.subtitle && (
                        <Text fontSize="$3" color="$gray10">
                          {item.subtitle}
                        </Text>
                      )}
                    </YStack>
                  </XStack>

                  <Text fontSize="$5" fontWeight="600" color="$gray10">
                    {item.count}
                  </Text>
                </XStack>
              </TouchableOpacity>
            ))}
          </YStack>
        </ScrollView>
      </Stack>
    </SafeAreaView>
  );
}
