import { useThemeController } from '@/config/theme';
import { useBottomBarPadding } from '@/ui/components/useBottomBarPadding';
import { Stack, Text, useTheme } from '@tamagui/core';
import { ChevronRight, CreditCard, ShieldAlert, Wrench } from '@tamagui/lucide-icons';
import { XStack, YStack } from '@tamagui/stacks';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
}

export default function OperationsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomPad = useBottomBarPadding();
  const { themeName } = useThemeController();
  const theme = useTheme();
  const mutedColor = theme.placeholderColor?.get() || '#6B7280';

  const menuItems: MenuItem[] = [
    {
      id: 'penalties',
      title: t('penalty'),
      description: t('penaltyDescription'),
      icon: <ShieldAlert size={24} color="#EF4444" />,
      color: '#EF4444',
      onPress: () => router.push('/operations/penalties'),
    },
    {
      id: 'service-operations',
      title: t('serviceOperations'),
      description: t('serviceOperationsDescription'),
      icon: <Wrench size={24} color="#F59E0B" />,
      color: '#F59E0B',
      onPress: () => router.push('/operations/service-operations'),
    },
    {
      id: 'hgs-operations',
      title: t('hgsOperations'),
      description: t('hgsOperationsDescription'),
      icon: <CreditCard size={24} color="#0EA5E9" />,
      color: '#0EA5E9',
      onPress: () => router.push('/operations/hgs-operations'),
    },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F2F2F7' }}>
      <Stack flex={1} backgroundColor="$background">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomPad + 20, paddingTop: 20, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          <Text fontSize={28} fontWeight="bold" color="$color" marginBottom={24}>
            {t('operations')}
          </Text>

          <YStack gap={12}>
            {menuItems.map((item) => (
              <Pressable key={item.id} onPress={item.onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <XStack
                  backgroundColor="$backgroundStrong"
                  borderRadius={16}
                  padding={16}
                  alignItems="center"
                  gap={14}
                >
                  <Stack
                    width={48}
                    height={48}
                    borderRadius={12}
                    backgroundColor={`${item.color}14`}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {item.icon}
                  </Stack>

                  <YStack flex={1} gap={2}>
                    <Text fontSize={16} fontWeight="600" color="$color">
                      {item.title}
                    </Text>
                    <Text fontSize={13} color="$placeholderColor" numberOfLines={1}>
                      {item.description}
                    </Text>
                  </YStack>

                  <ChevronRight size={20} color={mutedColor} />
                </XStack>
              </Pressable>
            ))}
          </YStack>
        </ScrollView>
      </Stack>
    </SafeAreaView>
  );
}
