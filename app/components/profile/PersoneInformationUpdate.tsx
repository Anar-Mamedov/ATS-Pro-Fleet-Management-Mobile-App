import { apiService } from '@/services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Text, View } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput } from 'react-native';

export default function PersoneInformationUpdate() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSave = () => {
    console.log('Saving personal information:', { firstName, lastName, email, phone, userCode });
  };

  return (
    <View width="100%">
      <YStack space="$4" width="100%">
        <YStack space="$2">
          <Text fontSize="$3" color="$gray10" fontWeight="500">
            {t('userCode')}
          </Text>
          <TextInput placeholder={t('enterUserCode')} value={userCode} onChangeText={setUserCode} style={styles.input} />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$gray10" fontWeight="500">
            {t('firstName')}
          </Text>
          <TextInput placeholder={t('enterFirstName')} value={firstName} onChangeText={setFirstName} style={styles.input} />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$gray10" fontWeight="500">
            {t('lastName')}
          </Text>
          <TextInput placeholder={t('enterLastName')} value={lastName} onChangeText={setLastName} style={styles.input} />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$gray10" fontWeight="500">
            {t('email')}
          </Text>
          <TextInput placeholder={t('enterEmail')} value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.input} />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$gray10" fontWeight="500">
            {t('phone')}
          </Text>
          <TextInput placeholder={t('enterPhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
