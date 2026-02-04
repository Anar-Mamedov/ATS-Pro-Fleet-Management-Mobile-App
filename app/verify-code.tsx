import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyCode() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const targetCode = params.code as string;
  const kullaniciId = params.kullaniciId as string;
  const userTypeId = params.userTypeId as string;
  const kullaniciKod = params.kullaniciKod as string;

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleResend = async () => {
    if (!kullaniciKod) return;
    setLoading(true);
    try {
      // Assuming companyKey is needed, retrieve it again or pass it.
      // For simplicity and to avoid passing sensitive keys in params if possible,
      // usually we retrieve from storage.
      const companyKey = await AsyncStorage.getItem('companyKey');
      if (companyKey) {
        await apiService.sendVerificationCode(kullaniciKod, companyKey);
        Alert.alert(t('success'), t('verificationCodeSent'));
        setTimer(300);
        setIsResendDisabled(true);
      }
    } catch (_error) {
      Alert.alert(t('error'), t('operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;

    setLoading(true);
    try {
      const companyKey = await AsyncStorage.getItem('companyKey');
      if (!companyKey) {
        Alert.alert(t('error'), t('companyKeyNotFound') || 'Firma anahtarı bulunamadı');
        setLoading(false);
        return;
      }

      console.log('API Request - VerifyResetCode:', {
        kullaniciId: Number(kullaniciId),
        userTypeId: Number(userTypeId),
        kullaniciEmail: email,
        kullaniciDogrulamaKod: verificationCode,
        companyKey,
      });

      const response = await apiService.verifyResetCode(Number(kullaniciId), Number(userTypeId), email, verificationCode, companyKey);

      console.log('API Response - VerifyResetCode:', response);

      if (response.status) {
        Alert.alert(t('success'), t('codeVerified'), [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/reset-password',
                params: {
                  accessToken: response.accessToken,
                  kullaniciId: kullaniciId,
                  userTypeId: userTypeId,
                },
              });
            },
          },
        ]);
      } else {
        let errorMessage = t('operationFailed');
        if (response.message === 'Invalid code !') errorMessage = t('invalidCode');
        else if (response.message === 'Code expired !') errorMessage = t('codeExpired');
        else if (response.message === 'Too many attempts !') errorMessage = t('tooManyAttempts');
        else if (response.message === 'New code is not generated yet or has been used !') errorMessage = t('codeNotGeneratedOrUsed');

        Alert.alert(t('error'), errorMessage);
      }
    } catch (error) {
      console.log('API Error - VerifyResetCode:', error);
      Alert.alert(t('error'), t('operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getTextFromEvent = (e: any) => e?.nativeEvent?.text ?? e?.target?.value ?? '';

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return '';
    const [name, domain] = emailStr.split('@');
    if (!name || !domain) return emailStr;
    const len = name.length;
    if (len <= 2) return `${name[0]}***@${domain}`;

    // Show first 2 chars, mask the rest, keep last char of name visible maybe?
    // Or simpler: first 2 visible, rest masked.
    // User asked "how much is shown and how much hidden, do like that".
    // Standard practice: first few chars visible.
    const visiblePart = name.slice(0, 2);
    return `${visiblePart}****@${domain}`;
  };

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
                {email ? `\n(${maskEmail(email)})` : ''}
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

              {/* Timer and Resend Button */}
              <YStack alignItems="center" space="$2" width="100%">
                <Text fontSize="$4" color={timer > 0 ? '$color' : '$red10'} fontFamily="SF Pro Text">
                  {timer > 0 ? `${t('timeRemaining')}: ${formatTime(timer)}` : t('codeExpired')}
                </Text>

                <Button size="$3" variant="outlined" onPress={handleResend} disabled={isResendDisabled || loading} opacity={isResendDisabled ? 0.5 : 1}>
                  <Text color="$blue10" fontFamily="SF Pro Text">
                    {t('resendCode')}
                  </Text>
                </Button>
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
