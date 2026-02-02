import { useThemeController } from '@/config/theme';
import { Pencil } from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, Pressable, StyleSheet } from 'react-native';
import { apiService } from '../../../services/apiService';
import UploadPhoto from './UploadPhoto';

interface UserInfo {
  siraNo: number;
  kullaniciKod: string;
  isim: string;
  soyAd: string;
  sifre: string;
  accessToken: string | null;
  aktif: boolean;
  gucluSifreAktif: boolean;
  firmaSifre: string | null;
  email: string;
  telefon: string;
  paraf: string;
  kullaniciRengi: string;
  defPhotoInfo: {
    tbResimId: number;
    rsmRefId: number;
    rsmRefGrup: string | null;
    rsmUzanti: string;
    rsmAd: string;
    rsmYol: string | null;
    rsmBoyut: number;
  };
  defRsmId: number;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function ProfileUserInfo() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDark = themeName === 'dark';
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  const fetchProfilePhoto = useCallback(async (photoId: number, extension: string, fileName: string) => {
    try {
      const photoArrayBuffer = await apiService.downloadPhotoById(photoId, extension, fileName);

      if (photoArrayBuffer) {
        const base64String = arrayBufferToBase64(photoArrayBuffer);
        const mimeType = extension.replace('.', '');
        setProfilePhoto(`data:image/${mimeType};base64,${base64String}`);
      }
    } catch (error: any) {
      console.error('Error fetching profile photo:', error);
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await AsyncStorage.getItem('id');

      if (!userId) {
        setError(t('userIdNotFound'));
        return;
      }

      const loginResponse = await AsyncStorage.getItem('loginResponse');
      let driverStatus = false;
      if (loginResponse) {
        const parsedLoginResponse = JSON.parse(loginResponse);
        driverStatus = parsedLoginResponse.isDriver === true;
      }
      setIsDriver(driverStatus);

      const userData = await apiService.getUserInfoById(userId);
      setUserInfo(userData);

      if (userData.defPhotoInfo && userData.defPhotoInfo.tbResimId) {
        await fetchProfilePhoto(userData.defPhotoInfo.tbResimId, userData.defPhotoInfo.rsmUzanti, userData.defPhotoInfo.rsmAd);
      }
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      setError(error.message || t('userInfoError'));
      Alert.alert(t('error'), error.message || t('userInfoError'));
    } finally {
      setLoading(false);
    }
  }, [fetchProfilePhoto, t]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleUploadSuccess = (photoUri: string) => {
    setProfilePhoto(photoUri);
    setShowUploadModal(false);
    fetchUserInfo();
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text fontSize="$5" textAlign="center" color={isDark ? '#FFFFFF' : '#18181B'}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text fontSize="$5" color="$red10" textAlign="center">
          {error}
        </Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.centerContainer}>
        <Text fontSize="$5" textAlign="center" color={isDark ? '#FFFFFF' : '#18181B'}>
          {t('userInfoNotFound')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YStack gap={24} alignItems="center">
        {/* Profile Photo */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarFrame, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5E7' }]}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text fontSize={32} fontWeight="600" color={isDark ? '#FFFFFF' : '#18181B'}>
                {userInfo.isim?.charAt(0) || ''}
                {userInfo.soyAd?.charAt(0) || ''}
              </Text>
            )}
          </View>

          {/* Edit Badge */}
          <Pressable onPress={() => setShowUploadModal(true)} style={styles.editBadge}>
            <Pencil size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* User Name */}
        <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
          {userInfo.isim || ''} {userInfo.soyAd || ''}
        </Text>
      </YStack>

      {/* Upload Photo Modal */}
      <Modal visible={showUploadModal} transparent={true} animationType="slide" onRequestClose={() => setShowUploadModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text fontSize="$6" fontWeight="600" color={isDark ? '#FFFFFF' : '#18181B'}>
                {t('upload_photo') || 'Fotoğraf Yükle'}
              </Text>
              <Pressable onPress={() => setShowUploadModal(false)} style={styles.closeButton}>
                <Text fontSize={24} color={isDark ? '#A1A1AA' : '#666666'}>×</Text>
              </Pressable>
            </View>

            {/* Upload Photo Component */}
            {userInfo && (
              <UploadPhoto
                refId={userInfo.siraNo}
                refGroup={isDriver ? 'SURUCU' : 'USER'}
                isForDefault={true}
                currentPhotoUri={profilePhoto || undefined}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  centerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
});
