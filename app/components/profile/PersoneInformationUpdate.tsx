import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Text, View } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput } from 'react-native';

interface PersoneInformationUpdateProps {
  onSuccess?: () => void;
}

export default function PersoneInformationUpdate({ onSuccess }: PersoneInformationUpdateProps) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem('id');
      if (!userId) {
        Alert.alert(t('error'), t('userIdNotFound'));
        return;
      }

      const userData = await apiService.getUserInfoById(userId);
      setUserInfo(userData);

      setFirstName(userData.isim || '');
      setLastName(userData.soyAd || '');
      setEmail(userData.email || '');
      setPhone(userData.telefon || '');
      setUserCode(userData.kullaniciKod || '');
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      Alert.alert(t('error'), error.message || t('userInfoError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const userData = {
        isDriver: userInfo?.isDriver || false,
        siraNo: userInfo?.siraNo || 0,
        kullaniciKod: userCode,
        isim: firstName,
        aktif: userInfo?.aktif || true,
        soyAd: lastName,
        email: email,
        telefon: phone,
      };

      // console.log('Saving personal information:', userData);

      const response = await apiService.updateUserInfo(userData);

      // API response'una göre bildirim göster
      if ([200, 201, 202].includes(response.statusCode)) {
        setNotification({
          type: 'success',
          message: t('operationSuccessful'),
        });

        // Başarılı güncelleme sonrası verileri yeniden yükle
        await fetchUserInfo();

        // 2 saniye sonra profil ekranına dön
        setTimeout(() => {
          setNotification(null);
          onSuccess?.();
        }, 2000);
      } else {
        setNotification({
          type: 'error',
          message: t('operationFailed'),
        });

        // 3 saniye sonra bildirimi gizle
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error: any) {
      console.error('Error updating user info:', error);
      setNotification({
        type: 'error',
        message: t('operationFailed'),
      });

      // 3 saniye sonra bildirimi gizle
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View width="100%">
      {/* Bildirim */}
      {notification && (
        <View
          position="absolute"
          top={-60}
          left={0}
          right={0}
          zIndex={1000}
          backgroundColor={notification.type === 'success' ? '$green10' : '$red10'}
          padding="$3"
          borderRadius="$4"
          marginHorizontal="$4"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="white" fontSize="$4" fontWeight="600" flex={1}>
              {notification.message}
            </Text>
            <Button size="$2" backgroundColor="transparent" color="white" onPress={() => setNotification(null)} padding="$1">
              ✕
            </Button>
          </XStack>
        </View>
      )}

      <YStack space="$4" width="100%">
        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('userCode')}
          </Text>
          <TextInput
            placeholder={t('enterUserCode')}
            value={userCode}
            onChangeText={setUserCode}
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[
              styles.input,
              { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' },
              userInfo?.isDriver && { color: '#9BA1A6' },
            ]}
            editable={!userInfo?.isDriver}
          />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('firstName')}
          </Text>
          <TextInput
            placeholder={t('enterFirstName')}
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('lastName')}
          </Text>
          <TextInput
            placeholder={t('enterLastName')}
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('email')}
          </Text>
          <TextInput
            placeholder={t('enterEmail')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('phone')}
          </Text>
          <TextInput
            placeholder={t('enterPhone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <Button backgroundColor="$blue10" color="white" borderRadius="$4" marginTop="$4" onPress={handleSave} fontSize="$5" fontWeight="600" disabled={loading}>
          {loading ? t('loading') : t('save')}
        </Button>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    color: '#FFFFFF',
  },
});
