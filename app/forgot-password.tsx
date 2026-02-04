import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { Check, ChevronDown } from '@tamagui/lucide-icons';
import { XStack, YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDarkMode = themeName === 'dark';
  const [userCode, setUserCode] = useState('');
  const [userType, setUserType] = useState<number>(2); // Default 2 (Driver)
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [modalVisible, slideAnim]);

  const userTypeOptions = useMemo(
    () => [
      { value: 1, label: t('manager') },
      { value: 2, label: t('driver') },
    ],
    [t]
  );

  const selectedOption = userTypeOptions.find((opt) => opt.value === userType);

  const handleBack = () => {
    router.back();
  };

  const handleResetPassword = async () => {
    if (!userCode.trim()) return;

    setLoading(true);
    try {
      const companyKey = await AsyncStorage.getItem('companyKey');
      if (!companyKey) {
        Alert.alert(t('error'), t('companyKeyNotFound'));
        setLoading(false);
        return;
      }

      console.log('Sending request to /ForgotPassword/GetUserEmail:', {
        kullaniciKod: userCode,
        userTypeId: userType,
      });

      const response = await apiService.getUserEmail(userCode, userType, companyKey);

      console.log('GetUserEmail response:', response);

      if (response && (response.kullaniciId === 0 || !response.kullaniciEmail)) {
        Alert.alert(t('error'), t('userNotFoundOrNoEmail'));
      } else if (response && response.kullaniciEmail) {
        console.log('User found, getting reset code...');

        // Step 2: Get Reset Code
        const codeResponse = await apiService.getResetCode(response.kullaniciId, response.kullaniciEmail, userType, companyKey);

        console.log('GetResetCode response:', codeResponse);

        if (codeResponse && codeResponse.kod) {
          // Step 3: Send Email (Mocked/Simulated)
          // SECURITY NOTE: Sending emails from client side using App Key is not recommended practice.
          // Using a backend service is safer. Implementing logic as requested.

          const emailSent = await sendEmail(response.kullaniciEmail, codeResponse.kod);

          if (emailSent) {
            // Step 4: Navigate to Verify Code Screen
            router.push({
              pathname: '/verify-code',
              params: {
                email: response.kullaniciEmail,
                code: codeResponse.kod,
                kullaniciId: response.kullaniciId,
              },
            });
          } else {
            Alert.alert(t('error'), t('emailSendError'));
          }
        } else {
          Alert.alert(t('error'), t('operationFailed'));
        }
      }
    } catch (error: any) {
      console.error('GetUserEmail error:', error);
      Alert.alert(t('error'), error.message || t('operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Mock Email Sending Function
  // In a real scenario, this would call a backend endpoint that handles SMTP.
  const sendEmail = async (email: string, code: string): Promise<boolean> => {
    console.log(`[SIMULATION] Sending email to ${email} with code: ${code}`);
    console.log(`[SIMULATION] Using Gmail App Key: 'yvwb qiou tiyv mrrl'`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return true to simulate success
    return true;
  };

  const getTextFromEvent = (e: any) => e?.nativeEvent?.text ?? e?.target?.value ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F0F0F0' }} edges={['top']}>
      <Stack flex={1} backgroundColor="$background">
        <TouchableOpacity
          onPress={handleBack}
          style={{
            position: 'absolute',
            top: 10,
            left: 20,
            zIndex: 1,
            padding: 8,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <YStack space="$4" alignItems="center">
              <Text fontSize="$8" color="$color" fontWeight="bold" marginBottom="$6" fontFamily="SF Pro Text">
                {t('forgotPassword')}
              </Text>

              <YStack width="100%" space="$3">
                <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                  {t('userCode')}
                </Text>
                <Input
                  value={userCode}
                  onChange={(e) => setUserCode(getTextFromEvent(e))}
                  placeholder={t('enterUserCode')}
                  autoCapitalize="none"
                  size="$4"
                  borderRadius="$3"
                  width="100%"
                  minHeight={50}
                  paddingVertical="$3"
                  maxFontSizeMultiplier={1.3}
                />
              </YStack>

              <YStack width="100%" space="$3">
                <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                  {t('userType')}
                </Text>

                <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal="$3"
                    paddingVertical="$3"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor={isDarkMode ? '#333' : '#ddd'}
                    backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
                    minHeight={50}
                  >
                    <Text fontSize="$4" color={isDarkMode ? '#fff' : '#000'} fontFamily="SF Pro Text">
                      {selectedOption ? selectedOption.label : t('selectUserType')}
                    </Text>
                    <ChevronDown size={20} color={isDarkMode ? '#fff' : '#000'} />
                  </XStack>
                </TouchableOpacity>
              </YStack>

              <Button size="$4" backgroundColor={userCode.length > 0 ? '$blue10' : '$gray5'} width="100%" onPress={handleResetPassword} disabled={userCode.length === 0 || loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text color="$color" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
                    {t('resetPassword')}
                  </Text>
                )}
              </Button>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal */}
        <Modal visible={modalVisible} transparent={true} animationType="none" onRequestClose={() => setModalVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Animated.View
              style={[
                styles.safeArea,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Pressable
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                    paddingBottom: insets.bottom + 20,
                  },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                {/* Handle */}
                <YStack alignItems="center" paddingVertical="$2">
                  <YStack width={40} height={4} borderRadius="$2" backgroundColor={isDarkMode ? '#444' : '#ccc'} />
                </YStack>

                {/* Title */}
                <Text fontSize="$6" fontWeight="bold" textAlign="center" marginBottom="$3" color={isDarkMode ? '#fff' : '#000'} fontFamily="SF Pro Text">
                  {t('selectUserType')}
                </Text>

                {/* Options */}
                <ScrollView style={styles.scrollView}>
                  <YStack gap="$2" paddingVertical="$2">
                    {userTypeOptions.map((option) => {
                      const isSelected = userType === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => {
                            setUserType(option.value);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <XStack
                            backgroundColor={isSelected ? '$blue2' : 'transparent'}
                            borderWidth={isSelected ? 1 : 0}
                            borderColor={isSelected ? '$blue10' : 'transparent'}
                            borderRadius="$3"
                            paddingHorizontal="$4"
                            paddingVertical="$3"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Text fontSize="$5" color={isDarkMode ? '#fff' : '#000'} fontFamily="SF Pro Text">
                              {option.label}
                            </Text>
                            {isSelected && <Check size={16} color="$blue10" />}
                          </XStack>
                        </TouchableOpacity>
                      );
                    })}
                  </YStack>
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: 400,
  },
  scrollView: {
    maxHeight: 300,
  },
});
