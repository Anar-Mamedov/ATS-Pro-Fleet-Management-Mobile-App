import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Text, View } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput } from 'react-native';

export default function PasswordUpdate() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const userIdStr = await AsyncStorage.getItem('id');
      if (!userIdStr) {
        Alert.alert(t('error'), t('userIdNotFound'));
        return;
      }

      const loginResponseStr = await AsyncStorage.getItem('loginResponse');
      let userTypeId = '1'; // Default Admin
      if (loginResponseStr) {
        const loginResponse = JSON.parse(loginResponseStr);
        if (loginResponse.isDriver) {
          userTypeId = '2'; // Driver
        }
      }

      const userId = parseInt(userIdStr, 10);
      const requestData = {
        userId: userId,
        previousPassword: currentPassword,
        updatedPassword: newPassword,
        userTypeId: userTypeId,
      };

      console.log('Password update request:', requestData);
      const response = await apiService.modifyUserPassword(requestData);
      console.log('Password update response:', response);

      if (response.statusCode === 403) {
        Alert.alert(t('error'), t('passwordUpdateFailIncorrect'));
      } else if (response.statusCode === 202) {
        Alert.alert(t('success'), t('passwordUpdateSuccess'));
        // Clear fields on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Fallback for other status codes
        if (response.status) {
          Alert.alert(t('success'), response.message || t('operationSuccessful'));
        } else {
          Alert.alert(t('error'), response.message || t('operationFailed'));
        }
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      Alert.alert(t('error'), error.message || t('operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View width="100%">
      <YStack space="$4" width="100%">
        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('currentPassword')}
          </Text>
          <TextInput
            placeholder={t('enterCurrentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('newPassword')}
          </Text>
          <TextInput
            placeholder={t('enterNewPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <YStack space="$2">
          <Text fontSize="$3" color="$color" opacity={0.7} fontWeight="500">
            {t('confirmPassword')}
          </Text>
          <TextInput
            placeholder={t('enterConfirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor={themeName === 'dark' ? '#9BA1A6' : '#6B7280'}
            style={[styles.input, { color: themeName === 'dark' ? '#FFFFFF' : '#111111', borderColor: themeName === 'dark' ? '#3A3A3C' : '#E5E7EB' }]}
          />
        </YStack>

        <Button backgroundColor="$blue10" color="white" borderRadius="$4" marginTop="$4" onPress={handleSave} fontSize="$5" fontWeight="600" disabled={loading}>
          {loading ? t('loading') : t('updatePassword')}
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
  },
});
