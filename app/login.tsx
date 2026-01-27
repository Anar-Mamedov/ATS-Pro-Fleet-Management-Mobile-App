import { useThemeController } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';

// Replaced custom StyledInput with Tamagui Input for proper theming

export default function Login() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [step, setStep] = useState<'company' | 'auth'>('company');
  const [companyKey, setCompanyKeyInput] = useState('');
  const [kullaniciKod, setKullaniciKod] = useState('');
  const [sifre, setSifre] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const getTextFromEvent = (e: any) => e?.nativeEvent?.text ?? e?.target?.value ?? '';
  const isDarkMode = themeName === 'dark';
  const rememberMeKey = 'rememberMe';
  const rememberedCredentialsKey = 'rememberedCredentials';

  useEffect(() => {
    checkCompanyInfo();
    loadRememberedCredentials();
  }, []);

  const checkCompanyInfo = async () => {
    try {
      const savedCompanyInfo = await AsyncStorage.getItem('companyInfo');
      const savedCompanyKey = await AsyncStorage.getItem('companyKey');
      const savedCompanyLogo = await AsyncStorage.getItem('companyLogo');

      if (savedCompanyInfo && savedCompanyKey) {
        setStep('auth');
        if (savedCompanyLogo) {
          setCompanyLogo(savedCompanyLogo);
        }
      }
    } catch (error) {
      console.error('Error checking company info:', error);
    }
  };

  const loadRememberedCredentials = async () => {
    try {
      const rememberMeValue = await AsyncStorage.getItem(rememberMeKey);
      if (rememberMeValue === 'true') {
        setRememberMe(true);
        const savedCredentials = await AsyncStorage.getItem(rememberedCredentialsKey);
        if (savedCredentials) {
          const parsedCredentials = JSON.parse(savedCredentials) as { kullaniciKod?: string; sifre?: string };
          if (typeof parsedCredentials.kullaniciKod === 'string') {
            setKullaniciKod(parsedCredentials.kullaniciKod);
          }
          if (typeof parsedCredentials.sifre === 'string') {
            setSifre(parsedCredentials.sifre);
          }
        }
      }
    } catch (error) {
      console.error('Error loading remembered credentials:', error);
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

      const isValidCompany =
        !!companyInfo && typeof companyInfo.siraNo === 'number' && companyInfo.siraNo > 0 && typeof companyInfo.firmaAdi === 'string' && companyInfo.firmaAdi.trim().length > 0;

      if (!isValidCompany) {
        throw new Error(t('companyInfoError'));
      }

      await AsyncStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      await AsyncStorage.setItem('companyKey', companyKey.trim());

      // Fetch company logo if logoId exists
      if (companyInfo?.logoId) {
        try {
          const requestPayload = {
            photoId: companyInfo.logoId,
            fileName: 'logo',
            extension: '.png',
          };
          console.log('Fetching company logo with request:', requestPayload);

          const logoData = await apiService.getClientAssets(companyInfo.logoId, 'logo', '.png');

          console.log('Logo data received, type:', typeof logoData);
          console.log('Logo data is ArrayBuffer:', logoData instanceof ArrayBuffer);

          if (logoData) {
            // Detect image format from data
            const uint8Array = new Uint8Array(logoData);
            const header = Array.from(uint8Array.slice(0, 12))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join(' ');
            console.log('Image header:', header);

            // Determine MIME type based on header
            let mimeType = 'image/png';
            if (header.includes('52 49 46 46')) {
              // RIFF (WebP)
              mimeType = 'image/webp';
            } else if (header.startsWith('89 50 4e 47')) {
              // PNG
              mimeType = 'image/png';
            } else if (header.startsWith('ff d8 ff')) {
              // JPEG
              mimeType = 'image/jpeg';
            }
            console.log('Detected MIME type:', mimeType);

            // Convert ArrayBuffer to base64 (React Native compatible way)
            // Convert Uint8Array to base64 string manually
            const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let base64 = '';
            const bytes = uint8Array;
            const len = bytes.length;

            for (let i = 0; i < len; i += 3) {
              const a = bytes[i];
              const b = i + 1 < len ? bytes[i + 1] : 0;
              const c = i + 2 < len ? bytes[i + 2] : 0;

              const bitmap = (a << 16) | (b << 8) | c;

              base64 += base64Chars[(bitmap >> 18) & 63];
              base64 += base64Chars[(bitmap >> 12) & 63];
              base64 += i + 1 < len ? base64Chars[(bitmap >> 6) & 63] : '=';
              base64 += i + 2 < len ? base64Chars[bitmap & 63] : '=';
            }

            const base64String = base64;
            const logoUri = `data:${mimeType};base64,${base64String}`;

            console.log('Converted ArrayBuffer to base64');
            console.log('Base64 string length:', base64String.length);
            console.log('Base64 preview (first 50 chars):', base64String.substring(0, 50));

            await AsyncStorage.setItem('companyLogo', logoUri);
            setCompanyLogo(logoUri);
            console.log('Logo successfully saved to state and AsyncStorage');
          } else {
            console.log('No logo data received from API');
          }
        } catch (logoError: any) {
          console.error('Error fetching company logo:', logoError);
          console.error('Logo error details:', {
            message: logoError?.message,
            status: logoError?.response?.status,
            data: logoError?.response?.data,
          });
          // Logo hatası ana işlemi engellemez
        }
      } else {
        console.log('No logoId in company info');
      }

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

      if (!loginData.isDriver) {
        Alert.alert(t('warning'), t('onlyDriverLogin'));
        return;
      }

      await AsyncStorage.setItem('loginResponse', JSON.stringify(loginData));
      await AsyncStorage.setItem('token', loginData.accessToken);
      await AsyncStorage.setItem('id', loginData.siraNo.toString());

      if (rememberMe) {
        await AsyncStorage.setItem(rememberMeKey, 'true');
        await AsyncStorage.setItem(
          rememberedCredentialsKey,
          JSON.stringify({
            kullaniciKod: kullaniciKod.trim(),
            sifre: sifre.trim(),
          }),
        );
      } else {
        await AsyncStorage.removeItem(rememberMeKey);
        await AsyncStorage.removeItem(rememberedCredentialsKey);
      }

      const fullName = [loginData.isim, loginData.soyAd].filter((part) => typeof part === 'string' && part.trim().length > 0).join(' ');
      const welcomeMessage = fullName ? `${t('welcomeUser')} ${fullName}` : t('welcomeUser');
      Alert.alert(t('success'), welcomeMessage);
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
      await AsyncStorage.removeItem('companyLogo');
      setCompanyLogo(null);
      setStep('company');
    } catch (error) {
      console.error('Error removing company info:', error);
      setStep('company');
    }
  };

  if (step === 'company') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F0F0F0' }} edges={['top']}>
        <Stack flex={1} backgroundColor="$background">
          <TouchableOpacity
            onPress={handleBackToWelcome}
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
                  {t('companyLogin')}
                </Text>

                <YStack width="100%" space="$3">
                  <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                    {t('companyKey')}
                  </Text>
                  <Input
                    value={companyKey}
                    onChange={(e) => setCompanyKeyInput(getTextFromEvent(e))}
                    placeholder={t('enterCompanyKey')}
                    autoCapitalize="none"
                    size="$4"
                    borderRadius="$3"
                    width="100%"
                    minHeight={50}
                    paddingVertical="$3"
                    maxFontSizeMultiplier={1.3}
                  />
                </YStack>

                <Button size="$4" backgroundColor="$blue10" width="100%" onPress={handleCompanySubmit} disabled={loading}>
                  <Text color="$color" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
                    {loading ? t('checking') : t('continue')}
                  </Text>
                </Button>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
        </Stack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeName === 'dark' ? '#000000' : '#F0F0F0' }} edges={['top']}>
      <Stack flex={1} backgroundColor="$background">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <YStack space="$4" alignItems="center">
              {companyLogo ? (
                <Image
                  source={{ uri: companyLogo }}
                  style={{
                    width: 200,
                    height: 100,
                    resizeMode: 'contain',
                    marginBottom: 1,
                  }}
                  onLoad={() => console.log('✅ Logo image loaded successfully')}
                  onError={(error) => console.error('❌ Logo image load error:', error.nativeEvent.error)}
                />
              ) : (
                <YStack
                  width={200}
                  height={100}
                  marginBottom={1}
                  borderWidth={2}
                  borderColor="$gray8"
                  borderStyle="dashed"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="$3"
                >
                  <Text color="$gray10" fontSize="$2">
                    Logo
                  </Text>
                </YStack>
              )}
              <Text fontSize="$8" color="$color" fontWeight="bold" marginBottom="$6" fontFamily="SF Pro Text">
                {t('login')}
              </Text>

              <YStack width="100%" space="$3">
                <Text fontSize="$5" color="$color" fontWeight="500" fontFamily="SF Pro Text">
                  {t('userCode')}
                </Text>
                <Input
                  value={kullaniciKod}
                  onChange={(e) => setKullaniciKod(getTextFromEvent(e))}
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
                  {t('password')}
                </Text>
                <Input
                  value={sifre}
                  onChange={(e) => setSifre(getTextFromEvent(e))}
                  placeholder={t('enterPassword')}
                  type="password"
                  size="$4"
                  borderRadius="$3"
                  width="100%"
                  minHeight={50}
                  paddingVertical="$3"
                  maxFontSizeMultiplier={1.3}
                />
              </YStack>

              <TouchableOpacity
                onPress={() => setRememberMe((previous) => !previous)}
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 4,
                }}
              >
                <Stack
                  width={22}
                  height={22}
                  borderRadius={6}
                  borderWidth={1.5}
                  borderColor={isDarkMode ? '#3A3A3C' : '#C7C7CC'}
                  backgroundColor={rememberMe ? '#0A84FF' : 'transparent'}
                  alignItems="center"
                  justifyContent="center"
                >
                  {rememberMe ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                </Stack>
                <Text marginLeft="$3" color="$color" fontSize="$4" fontFamily="SF Pro Text">
                  {t('rememberMe')}
                </Text>
              </TouchableOpacity>

              <Button size="$4" backgroundColor="$green10" width="100%" onPress={handleLogin} disabled={loading}>
                <Text color="$color" fontWeight="400" fontSize="$4" fontFamily="SF Pro Text">
                  {loading ? t('loggingIn') : t('login')}
                </Text>
              </Button>

              <Button size="$3" variant="outlined" marginTop="$4" onPress={handleChangeCompany}>
                <Text color="$blue10" fontFamily="SF Pro Text">
                  {t('changeCompany')}
                </Text>
              </Button>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </Stack>
    </SafeAreaView>
  );
}
