import { Pencil } from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text, styled, getVariable, useTheme } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
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

// Styled components using standard Tamagui theme tokens
const Container = styled(Stack, {
  padding: 16,
  width: '100%',
});

const CenterContainer = styled(Stack, {
  padding: 16,
  alignItems: 'center',
  justifyContent: 'center',
});

const AvatarFrame = styled(Stack, {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

const UserName = styled(Text, {
  fontSize: 24,
  fontWeight: '700',
  color: '$color',
  textAlign: 'center',
});

const ModalContent = styled(Stack, {
  backgroundColor: '$backgroundStrong',
  borderRadius: 20,
  padding: 20,
  width: '90%',
  maxWidth: 400,
});

export default function ProfileUserInfo() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  // For non-Tamagui components
  const accentBg = getVariable(theme.accentBackground);

  const fetchProfilePhoto = useCallback(async (photoId: number, extension: string, fileName: string) => {
    try {
      const photoArrayBuffer = await apiService.downloadPhotoById(photoId, extension, fileName);

      if (photoArrayBuffer) {
        const base64String = arrayBufferToBase64(photoArrayBuffer);
        const mimeType = extension.replace('.', '');
        setProfilePhoto(`data:image/${mimeType};base64,${base64String}`);
      }
    } catch (err: any) {
      console.error('Error fetching profile photo:', err);
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
    } catch (err: any) {
      console.error('Error fetching user info:', err);
      setError(err.message || t('userInfoError'));
      Alert.alert(t('error'), err.message || t('userInfoError'));
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

  const handleUploadError = (err: string) => {
    console.error('Upload error:', err);
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <CenterContainer>
        <Text fontSize="$5" textAlign="center" color="$color">
          {t('loading')}
        </Text>
      </CenterContainer>
    );
  }

  if (error) {
    return (
      <CenterContainer>
        <Text fontSize="$5" color="$error" textAlign="center">
          {error}
        </Text>
      </CenterContainer>
    );
  }

  if (!userInfo) {
    return (
      <CenterContainer>
        <Text fontSize="$5" textAlign="center" color="$color">
          {t('userInfoNotFound')}
        </Text>
      </CenterContainer>
    );
  }

  return (
    <Container>
      <YStack gap={24} alignItems="center">
        {/* Profile Photo */}
        <View style={styles.avatarContainer}>
          <AvatarFrame>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text fontSize={32} fontWeight="600" color="$color">
                {userInfo.isim?.charAt(0) || ''}
                {userInfo.soyAd?.charAt(0) || ''}
              </Text>
            )}
          </AvatarFrame>

          {/* Edit Badge */}
          <Pressable onPress={() => setShowUploadModal(true)} style={[styles.editBadge, { backgroundColor: accentBg }]}>
            <Pencil size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* User Name */}
        <UserName>
          {userInfo.isim || ''} {userInfo.soyAd || ''}
        </UserName>
      </YStack>

      {/* Upload Photo Modal */}
      <Modal visible={showUploadModal} transparent={true} animationType="slide" onRequestClose={() => setShowUploadModal(false)}>
        <View style={styles.modalOverlay}>
          <ModalContent>
            {/* Modal Header */}
            <Stack flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={20}>
              <Text fontSize="$6" fontWeight="600" color="$color">
                {t('upload_photo') || 'Fotoğraf Yükle'}
              </Text>
              <Pressable onPress={() => setShowUploadModal(false)} style={styles.closeButton}>
                <Text fontSize={24} color="$placeholderColor">×</Text>
              </Pressable>
            </Stack>

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
          </ModalContent>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 5,
  },
});
