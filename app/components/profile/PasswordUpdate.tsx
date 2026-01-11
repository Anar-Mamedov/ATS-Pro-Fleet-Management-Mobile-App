import { useThemeController } from '@/config/theme';
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
  const [loading] = useState(false);

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }

    // TODO: Implement password update API call
    console.log('Updating password...');
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
