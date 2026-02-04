import { useThemeController } from '@/config/theme';
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

export default function VerifyCode() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const targetCode = params.code as string;
  // const kullaniciId = params.kullaniciId as string; // Will be used in next step

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleVerify = () => {
    if (!verificationCode.trim()) return;

    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      if (verificationCode === targetCode) {
        // Proceed to next step (Reset Password Screen - to be implemented)
        Alert.alert(t('success'), 'Kod doğrulandı! (Şifre sıfırlama ekranına yönlendirilecek)');
      } else {
        Alert.alert(t('error'), 'Hatalı doğrulama kodu.');
      }
    }, 1000);
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
                {t('verify')}
              </Text>

              <Text fontSize="$4" color="$gray10" textAlign="center" marginBottom="$4">
                {t('verificationCodeSent')}
                {email ? `\n(${email})` : ''}
              </Text>

              <YStack width="100%" space="$3">
                <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                  {t('enterVerificationCode')}
                </Text>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(getTextFromEvent(e))}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  size="$4"
                  borderRadius="$3"
                  width="100%"
                  minHeight={50}
                  paddingVertical="$3"
                  maxFontSizeMultiplier={1.3}
                  textAlign="center"
                  style={{ fontSize: 24, letterSpacing: 4 }}
                />
              </YStack>

              <Button
                size="$4"
                backgroundColor={verificationCode.length === 6 ? '$blue10' : '$gray5'}
                width="100%"
                onPress={handleVerify}
                disabled={verificationCode.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text color="$color" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
                    {t('verify')}
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
