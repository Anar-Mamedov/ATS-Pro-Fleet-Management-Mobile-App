import { useThemeController } from '@/config/theme';
import DocumentUpload from '@/ui/components/DocumentUpload';
import ResimUpload from '@/ui/components/ResimUpload';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack as ExpoStack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'documents' | 'photos';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_HORIZONTAL_PADDING = 48;

export default function PenaltyDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeName } = useThemeController();
  const { siraNo, plaka, cezaTuru } = useLocalSearchParams<{ siraNo: string; plaka: string; cezaTuru: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isDark = themeName === 'dark';
  const refId = Number(siraNo);
  const tabWidth = (SCREEN_WIDTH - TAB_HORIZONTAL_PADDING) / 2;

  const switchTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      Animated.spring(slideAnim, {
        toValue: tab === 'documents' ? 0 : 1,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start();
    },
    [slideAnim],
  );

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

  const activeIconColor = isDark ? '#0A84FF' : '#0066FF';
  const inactiveIconColor = isDark ? '#8E8E93' : '#6B6B70';
  const activeTextColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}>
      <ExpoStack.Screen options={{ headerShown: false }} />
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <LinearGradient colors={isDark ? ['#EF4444', '#B91C1C'] : ['#EF4444', '#F87171']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <YStack flex={1} gap={2}>
            <Text fontSize={17} fontWeight="700" color="white" numberOfLines={1}>
              {cezaTuru || t('penalty')}
            </Text>
            <Text fontSize={13} color="rgba(255,255,255,0.8)">
              {plaka}
            </Text>
          </YStack>
        </LinearGradient>

        {/* Segmented Tab Control */}
        <YStack paddingHorizontal={24} paddingTop={16} paddingBottom={8}>
          <XStack height={48} borderRadius={14} backgroundColor={isDark ? '#1C1C1E' : '#E8E8ED'} padding={4} position="relative">
            {/* Animated Indicator */}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  width: tabWidth,
                  transform: [{ translateX }],
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.4 : 0.12,
                      shadowRadius: 6,
                    },
                    android: { elevation: 3 },
                  }),
                },
              ]}
            />

            {/* Documents Tab */}
            <Pressable style={styles.tabButton} onPress={() => switchTab('documents')}>
              <Ionicons
                name={activeTab === 'documents' ? 'document-text' : 'document-text-outline'}
                size={18}
                color={activeTab === 'documents' ? activeIconColor : inactiveIconColor}
              />
              <Text
                fontSize={13}
                fontWeight={activeTab === 'documents' ? '600' : '500'}
                color={activeTab === 'documents' ? activeTextColor : inactiveIconColor}
                marginLeft={6}
              >
                {t('documents')}
              </Text>
            </Pressable>

            {/* Photos Tab */}
            <Pressable style={styles.tabButton} onPress={() => switchTab('photos')}>
              <Ionicons
                name={activeTab === 'photos' ? 'images' : 'images-outline'}
                size={18}
                color={activeTab === 'photos' ? activeIconColor : inactiveIconColor}
              />
              <Text
                fontSize={13}
                fontWeight={activeTab === 'photos' ? '600' : '500'}
                color={activeTab === 'photos' ? activeTextColor : inactiveIconColor}
                marginLeft={6}
              >
                {t('photos')}
              </Text>
            </Pressable>
          </XStack>
        </YStack>

        {/* Tab Content */}
        <YStack flex={1}>
          {activeTab === 'documents' ? (
            <DocumentUpload refId={refId} refGroup="CEZA" editable />
          ) : (
            <ResimUpload refId={refId} refGroup="CEZA" />
          )}
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 40,
    borderRadius: 11,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
