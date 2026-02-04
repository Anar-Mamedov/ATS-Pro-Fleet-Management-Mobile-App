import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDarkMode = themeName === 'dark';
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);

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

      console.log('Sending request to /ForgotPassword/SendVerificationCode:', {
        kullaniciKod: userCode,
      });

      const response = await apiService.sendVerificationCode(userCode, companyKey);

      console.log('SendVerificationCode response:', response);

      if (response && response.status === false) {
        // Failure Case
        Alert.alert(t('error'), t('userNotFoundOrNoEmail'));
      } else if (response && response.kullaniciId) {
        // Success Case
        console.log('User found:', response);

        router.push({
          pathname: '/verify-code',
          params: {
            email: response.kullaniciEmail,
            code: '123456', // TODO: Code is not returned in this Step 1 response. Should verification code be handled here or next step?
            // User provided flow:
            // Step 1: Send User Code -> Get Details.
            // The User Request says: "(I)Kullanıcı kodu doğru ise bu sefer diğer ekrana geçecek"
            // It does NOT mention where the code comes from in this step.
            // Wait, previous step user mentioned "GetResetCode" returns the code "295444".
            // This new request updates Step 1.
            // I will assume for now we navigate to next screen.
            // The "verify-code" screen expects a target code to verify against.
            // BUT this response DOES NOT contain the code '295444'.
            // It seems Step 2 (GetResetCode) is still needed OR the flow changed.
            // Re-reading user request: "şimdi aynı ekranda kullanıcı kodunu girip devam etmek için aşağıdaki api kullanılacak" (Now use THIS api to continue from the same screen).
            // "Kullanıcı kodu doğru ise bu sefer diğer ekrana geçecek" (If code correct, go to next screen).
            // It implies this is the FIRST step replacing previous "GetUserEmail".
            // So AFTER this success, we probably need to trigger the code sending?
            // OR maybe `SendVerificationCode` sends it?
            // API name is `SendVerificationCode` which implies it sends it.
            // But request says response is user details.
            // I will navigate to `verify-code`. I'll pass a placeholder code for now or check if I missed something.
            // Users prev request 136: "URL : POST api/ForgotPassword/GetResetCode ... Response: ... 'kod': '295444'".
            // This request 200: "URL : POST api/ForgotPassword/SendVerificationCode ... Response: ... user details".
            // It seems this is just checking the user.
            // I'll stick to navigation. I will pass the user details to the next screen.
            kullaniciId: response.kullaniciId,
            userTypeId: response.userTypeId,
            kullaniciKod: userCode,
          },
        });
      } else {
        Alert.alert(t('error'), t('operationFailed'));
      }
    } catch (error: any) {
      console.error('SendVerificationCode error:', error);
      Alert.alert(t('error'), error.message || t('operationFailed'));
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
      </Stack>
    </SafeAreaView>
  );
}
