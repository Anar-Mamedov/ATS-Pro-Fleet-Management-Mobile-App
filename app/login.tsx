import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text, styled } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TextInput, TouchableOpacity } from 'react-native';
import { apiService } from '../services/apiService';

const StyledInput = styled(TextInput, {
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$3',
  padding: '$3',
  backgroundColor: '$background',
});

export default function Login() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'company' | 'auth'>('company');
  const [companyKey, setCompanyKeyInput] = useState('');
  const [kullaniciKod, setKullaniciKod] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCompanyInfo();
  }, []);

  const checkCompanyInfo = async () => {
    try {
      const savedCompanyInfo = await AsyncStorage.getItem('companyInfo');
      const savedCompanyKey = await AsyncStorage.getItem('companyKey');

      if (savedCompanyInfo && savedCompanyKey) {
        setStep('auth');
      }
    } catch (error) {
      console.error('Error checking company info:', error);
    }
  };

  const handleBackToWelcome = () => {
    router.push('/welcome');
  };

  const handleCompanySubmit = async () => {
    if (!companyKey.trim()) {
      Alert.alert(t('error'), t('enterCompanyKeyError'));
      return;
    }

    setLoading(true);
    try {
      const companyInfo = await apiService.getCompanyInfo(companyKey.trim());

      await AsyncStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      await AsyncStorage.setItem('companyKey', companyKey.trim());

      setStep('auth');
      Alert.alert(t('success'), t('companyInfoSuccess'));
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('companyInfoError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!kullaniciKod.trim() || !sifre.trim()) {
      Alert.alert(t('error'), t('enterCredentialsError'));
      return;
    }

    setLoading(true);
    try {
      const savedCompanyKey = await AsyncStorage.getItem('companyKey');
      if (!savedCompanyKey) {
        Alert.alert(t('error'), t('companyKeyNotFound'));
        return;
      }

      const loginData = await apiService.login(kullaniciKod.trim(), sifre.trim(), savedCompanyKey);

      await AsyncStorage.setItem('token', loginData.accessToken);
      await AsyncStorage.setItem('id', loginData.siraNo.toString());

      Alert.alert(t('success'), `${t('welcomeUser')} ${loginData.isim} ${loginData.soyAd}`);
      router.replace('/');
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCompany = async () => {
    try {
      await AsyncStorage.removeItem('companyInfo');
      await AsyncStorage.removeItem('companyKey');
      setStep('company');
    } catch (error) {
      console.error('Error removing company info:', error);
      setStep('company');
    }
  };

  if (step === 'company') {
    return (
      <Stack flex={1} backgroundColor="$background">
        <TouchableOpacity
          onPress={handleBackToWelcome}
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 1,
            padding: 8,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <Stack flex={1} justifyContent="center" padding="$4">
          <YStack space="$4" alignItems="center">
            <Text fontSize="$8" fontWeight="bold" marginBottom="$6" fontFamily="SF Pro Text">
              {t('companyLogin')}
            </Text>

            <YStack width="100%" space="$3">
              <Text fontSize="$5" fontWeight="500" fontFamily="SF Pro Text">
                {t('companyKey')}
              </Text>
              <StyledInput value={companyKey} onChangeText={setCompanyKeyInput} placeholder={t('enterCompanyKey')} autoCapitalize="none" />
            </YStack>

            <Button size="$4" backgroundColor="#007AFF" width="100%" onPress={handleCompanySubmit} disabled={loading}>
              <Text color="white" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
                {loading ? t('checking') : t('continue')}
              </Text>
            </Button>
          </YStack>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack flex={1} justifyContent="center" padding="$4" backgroundColor="$background">
      <YStack space="$4" alignItems="center">
        <Text fontSize="$8" fontWeight="bold" marginBottom="$6" fontFamily="SF Pro Text">
          {t('login')}
        </Text>

        <YStack width="100%" space="$3">
          <Text fontSize="$5" fontWeight="500" fontFamily="SF Pro Text">
            {t('userCode')}
          </Text>
          <StyledInput value={kullaniciKod} onChangeText={setKullaniciKod} placeholder={t('enterUserCode')} autoCapitalize="none" />
        </YStack>

        <YStack width="100%" space="$3">
          <Text fontSize="$5" fontWeight="500" fontFamily="SF Pro Text">
            {t('password')}
          </Text>
          <StyledInput value={sifre} onChangeText={setSifre} placeholder={t('enterPassword')} secureTextEntry />
        </YStack>

        <Button size="$4" backgroundColor="#34C759" width="100%" onPress={handleLogin} disabled={loading}>
          <Text color="white" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
            {loading ? t('loggingIn') : t('login')}
          </Text>
        </Button>

        <Button size="$3" variant="outlined" marginTop="$4" onPress={handleChangeCompany}>
          <Text color="$blue10" fontFamily="SF Pro Text">
            {t('changeCompany')}
          </Text>
        </Button>
      </YStack>
    </Stack>
  );
}
