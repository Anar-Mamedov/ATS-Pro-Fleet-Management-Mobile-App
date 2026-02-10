import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPassword() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const params = useLocalSearchParams();

  const accessToken = params.accessToken as string;
  const kullaniciId = params.kullaniciId as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      console.log('[ResetPassword] Sending Request to API: /Profile/ResetPassword');
      console.log('[ResetPassword] Request Payload:', {
        userId: Number(kullaniciId),
        updatedPassword: password,
      });
      console.log('[ResetPassword] Auth Header:', accessToken ? 'Bearer ' + accessToken.substring(0, 20) + '...' : 'Missing');

      const response = await apiService.completePasswordReset(Number(kullaniciId), password, accessToken);

      console.log('[ResetPassword] Response Received:', response);
      if (response.success || response.status) {
        // Checking both just in case, based on standard API pattern or specific endpoint response
        Alert.alert(t('success'), t('passwordResetSuccess'), [
          { text: 'OK', onPress: () => router.replace('/') }, // Go to login/home
        ]);
      } else {
        Alert.alert(t('error'), response.message || t('operationFailed'));
      }
    } catch (error: any) {
      console.log('[ResetPassword] API Error:', error);
      Alert.alert(t('error'), t('operationFailed'));
    } finally {
      setLoading(false);
    }
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
                {t('resetPassword')}
              </Text>

              {/* New Password */}
              <YStack width="100%" space="$3">
                <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                  {t('newPassword')}
                </Text>
                <YStack>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(getTextFromEvent(e))}
                    placeholder={t('enterNewPassword')}
                    secureTextEntry={!showPassword}
                    keyboardType="default"
                    // @ts-ignore
                    type={showPassword ? 'text' : 'password'}
                    size="$4"
                    borderRadius="$3"
                    width="100%"
                    minHeight={50}
                    paddingVertical="$3"
                    maxFontSizeMultiplier={1}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 12 }}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                  </TouchableOpacity>
                </YStack>
              </YStack>

              {/* Confirm Password */}
              <YStack width="100%" space="$3">
                <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                  {t('confirmPassword')}
                </Text>
                <YStack>
                  <Input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(getTextFromEvent(e))}
                    placeholder={t('confirmNewPassword')}
                    secureTextEntry={!showConfirmPassword}
                    keyboardType="default"
                    // @ts-ignore
                    type={showConfirmPassword ? 'text' : 'password'}
                    size="$4"
                    borderRadius="$3"
                    width="100%"
                    minHeight={50}
                    paddingVertical="$3"
                    maxFontSizeMultiplier={1}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: 12 }}>
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                  </TouchableOpacity>
                </YStack>
              </YStack>

              <Button
                size="$4"
                backgroundColor={password && confirmPassword ? '$blue10' : '$gray5'}
                width="100%"
                onPress={handleSave}
                disabled={!password || !confirmPassword || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text color="$color" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
                    {t('save')}
                  </Text>
                )}
              </Button>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </Stack>
    </SafeAreaView>
  );
}
